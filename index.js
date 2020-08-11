const fs = require("fs");
const path = require("path");
const http = require("http");
// const https = require("https");

const express = require("express");

const handleResult = (resolve, reject) => (error, result) => {
    if (error) {
        reject(error);
        return;
    }
    resolve(result);
};

// const mkdirAsync = (route, recursive = true, options = {}) => new Promise((resolve, reject) => {
//     fs.mkdir(route, { recursive, ...options }, handleResult(resolve, reject));
// });

// const readdirAsync = (route, options = {}) => new Promise((resolve, reject) => {
//     fs.readdir(route, options, handleResult(resolve, reject));
// });

const readFileAsync = (route, encoding = "utf-8", options = {}) => new Promise((resolve, reject) => {
    fs.readFile(route, { encoding, ...options }, handleResult(resolve, reject));
});

const loadLibs = route => {
    let libFilenames = [];

    try {
        libFilenames = fs.readdirSync(route);
    } catch (error) {
        libFilenames = [];
    }

    const libModules = libFilenames.map(filename => {
        return [
            filename.replace(/\.js$/, ""),
            require(path.join(route, `${filename}`))
        ];
    });

    const lib = libModules.reduce((lib, [name, fun]) => {
        let spread = {};
        if (typeof fun === "object" && fun.constructor === Object) {
            spread = fun;
            // if (fun.docs) spread[`@${name}/docs`] = fun.docs;
        }
        return {
            ...lib,
            ...spread,
            [name]: fun,
        };
    }, {});

    return lib;
};

const libInternal = loadLibs(path.join(__dirname, "lib"));
const libLocal = loadLibs(path.join(process.cwd(), "lib"));

const lib = {
    ...libInternal,
    ...libLocal
};

const createInstance = server => {
    return {
        lib,
        containers: {},
        server,
        app: server ? server.app : null,
        protocol: server ? server.protocol : "virtual",
        port: null,
        host: null,
        domain: null,
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
        panel() {
            const container = this.openContainer("@panel", {
                local: true
            });

            if (this.app) {
                this.app.use(container.router);
            }

            return container;
        },
        closeContainer(name) {
            if (!this.containers[name]) throw new Error(`ballena/error: invalid container "${name}"`);
            this.containers[name].closed = true;
        },
        openContainer(name, options = {}) {
            options.basePath = options.local ? __dirname : options.basePath || process.cwd();

            const router = express.Router();
            
            this.containers[name] = {
                name,
                options,
                router
            };

            router.use(`/${name}`, (request, response, next) => {
                if (this.containers[name].closed) {
                    response.status(404).send(`<pre>Cannot ${request.method} /${name}${request.path} (closed)</pre>`);
                    return;
                }
                next();
            });
            router.use(`/${name}`, express.static(path.join(options.basePath, name, "view")));
            router.use(`/${name}/api/`, async (request, respose, next) => {
                const apiName = request.path.replace(/\/$/g, "/index");

                const filename = apiName.replace(/^\//, "");

                const protocol = {
                    "@ballena": "v1.0",
                    container: name,
                    api: filename,
                    exists: true,
                    error: null,
                    result: null,
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
                        name === "@panel" ? this.containers : {
                            [name]: this.containers[name]
                        },
                        this.containers[name],
                        protocol,
                        input,
                        require,
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
                    console.log(error);
                }

                try {
                    respose.send(protocol);
                } catch (error) {
                    respose.status(500).send(`${error}`);
                }
            });

            return this.containers[name];
        },
        container(name) {
            const container = this.openContainer(name);

            if (this.app) {
                this.app.use(container.router);
            }

            return container;
        }
    };
};

module.exports = {
    createInstance,
    createApp() {
        const app = express();
        app.get("/", (request, response) => {
            response.send(`Hello ${request.query.name || "you"}`);
        });

        this.app = app;

        return this.app;
    },
    httpServer() {
        const app = this.createApp();

        const server = http.createServer(app);

        server.app = app;
        server.protocol = "http";

        return this.createInstance(server);
    },
};