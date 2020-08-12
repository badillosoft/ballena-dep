const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const busboy = require("connect-busboy");

dotenv.config(path.join(process.cwd(), ".env"));

const handleResult = (resolve, reject) => (error, result) => {
    if (error) {
        reject(error);
        return;
    }
    resolve(result);
};

const readFileAsync = (route, encoding = "utf-8", options = {}) => new Promise((resolve, reject) => {
    fs.readFile(route, { encoding, ...options }, handleResult(resolve, reject));
});

const createInstance = (server, app = null) => {
    return {
        lib: {},
        containers: {},
        require: server ? server.require : null,
        server,
        app: app || (server ? server.app : null),
        protocol: server ? server.protocol : "virtual",
        port: null,
        host: null,
        domain: null,
        addLibrary(lib) {
            this.lib = {
                ...this.lib,
                ...lib
            };
        },
        async start(port = 4000, host = "0.0.0.0", domain = "localhost") {
            this.port = port;
            this.host = host;
            this.domain = domain;

            return await new Promise(resolve => {
                this.server.listen(4000, () => {
                    this.serverStartedAt = new Date();
                    console.log(`Server started at ${this.protocol}://${this.host}:${this.port}/`);
                    console.log(`                  ${this.protocol}://${this.domain}:${this.port}/`);
                    resolve(this);
                });
            });
        },
        async stop() {
            return await new Promise(resolve => {
                this.server.close(() => {
                    this.serverStoppedAt = new Date();
                    console.log(`Server stopped at ${this.protocol}://${this.host}:${this.port}/`);
                    console.log(`                  ${this.protocol}://${this.domain}:${this.port}/`);
                    resolve(this);
                });
            });
        },
        async restart(handle = (() => null)) {
            await this.stop();
            await handle(this);
            await this.start(this.port, this.host, this.domain);
        },
        addPanel() {
            const container = this.createContainer("@ballena", {
                local: true
            });

            if (this.app) {
                this.app.use(container.router);
            }

            return container;
        },
        removeContainer(name) {
            if (!this.containers[name]) throw new Error(`ballena/error: invalid container "${name}"`);
            this.containers[name].closed = true;
        },
        createContainer(name, options = {}) {
            options.basePath = options.local ? __dirname : options.basePath || process.cwd();

            const router = express.Router();

            this.containers[name] = {
                name,
                options,
                router
            };

            router.use(`/${name}`, (request, response, next) => {
                if (this.containers[name].closed) {
                    response.status(404).send(`<pre>Cannot ${request.method} /${name}${request.path} (removed)</pre>`);
                    return;
                }
                next();
            });
            router.use(`/${name}`, express.static(path.join(options.basePath, name, "view")));
            router.use(`/${name}/api/`, async (request, respose, next) => {
                const apiName = request.path.replace(/\/$/g, "/index");

                const filename = apiName.replace(/^\//, "");

                const protocol = {
                    ballena: "v1.0",
                    container: name,
                    api: filename,
                    exists: true,
                    error: null,
                    result: null,
                    async handler() {},
                    output(handler) {
                        protocol.handler = handler;
                    },
                    logs: []
                };

                const code = await readFileAsync(path.join(options.basePath, name, "api", `/${filename}.js`)).catch(() => {
                    protocol.exists = false;
                    return `throw new Error("ballena/error: api ${name}/${filename} is not exists")`;
                });

                const input = key => {
                    const self = {
                        ...(request.query || {}),
                        ...(request.body || {}),
                    };
                    if (!key || key === "self") return self;
                    return self[key];
                };

                // console.log("code", code);

                try {
                    protocol.result = await new Function(
                        "server",
                        "containers",
                        "container",
                        "protocol",
                        "input",
                        "require",
                        "request",
                        "response",
                        "next",
                        "lib",
                        ...Object.keys(this.lib),
                        `return (async () => {
                            ${code}
                        })();`
                    )(
                        this,
                        name === options.local ? this.containers : {
                            [name]: this.containers[name]
                        },
                        this.containers[name],
                        protocol,
                        input,
                        (name, ...params) => {
                            if (name === "ballena") {
                                return protocol;
                            }
                            return (options.local ? require : this.require)(name, ...params);
                        },
                        request,
                        respose,
                        next,
                        this.lib,
                        ...Object.values(this.lib),
                    ).catch(error => {
                        protocol.error = `${error}`.replace(/^Error:\s*/, "");
                        return null;
                    });
                } catch (error) {
                    protocol.error = `${error}`.replace(/^Error:\s*/, "");
                    protocol.code = code;
                }

                const handler = typeof protocol.handler === "function" ? protocol.handler : () => protocol.handler;
                try {
                    protocol.output = await handler(protocol);
                } catch (error) {
                    protocol.error = `${error}`.replace(/^Error:\s*/, "");
                }

                delete protocol.handler;

                try {
                    respose.send(protocol);
                } catch (error) {
                    respose.status(500).send(`${error}`);
                }
            });

            return this.containers[name];
        },
        addContainer(name) {
            const container = this.createContainer(name);

            if (this.app) {
                this.app.use(container.router);
            }

            return container;
        }
    };
};

module.exports = {
    require,
    createInstance,
    config(require) {
        this.require = require;
    },
    createApp() {
        dotenv.config(path.join(process.cwd(), ".env"));

        const app = express();

        app.get("/", (request, response) => {
            response.send(`Hello ${request.query.name || "you"}`);
        });

        app.use(express.static(path.join(__dirname, "public")));
        app.use("/static", express.static(path.join(__dirname, "static")));
        app.use("/file", express.static(path.join(process.cwd(), "file")));
        app.use("/cdn", express.static(path.join(process.cwd(), "cdn")));
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
        app.use(busboy());

        this.app = app;

        return this.app;
    },
    httpServer() {
        const app = this.createApp();

        const server = http.createServer(app);

        server.app = app;
        server.protocol = "http";
        server.require = this.require;

        return this.createInstance(server);
    },
    httpsServer(options) {
        const app = this.createApp();

        const server = https.createServer(options, app);

        server.app = app;
        server.protocol = "http";
        server.require = this.require;

        return this.createInstance(server);
    },
    output() {
        console.warn(`ballena/output: single mode is not supported`);
    }
};