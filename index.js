const fs = require("fs");
const path = require("path");

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

const readdirAsync = (route, options = {}) => new Promise((resolve, reject) => {
    fs.readdir(route, options, handleResult(resolve, reject));
});

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
            if (fun.docs) spread[`@${name}/docs`] = fun.docs;
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

module.exports = {
    lib,
    containers: {},
    // require,
    // config(require) {
    //     this.require = require;
    // },
    panel() {
        return this.openContainer("@panel", {
            local: true
        });
    },
    openContainer(name, options = {}) {
        options.basePath = options.local ? __dirname : options.basePath || process.cwd();

        this.containers[name] = {
            name,
            options
        };

        const router = express.Router();

        router.use(`/${name}`, express.static(path.join(options.basePath, name, "view")));
        router.all(`/${name}/api/:name?`, async (request, respose, next) => {
            const { name: apiName } = request.params;

            const filename = apiName || "index";

            let exists = true;

            const code = await readFileAsync(path.join(options.basePath, name, "api", `/${filename}.js`)).catch(() => {
                exists = false;
                return `throw new Error("ballena/error: api ${name}/${filename} is not exists")`;
            });

            const protocol = {
                "@ballena": "v1.0",
                container: name,
                api: filename,
                exists,
                error: null,
                result: null
            };

            protocol.result = await new Function(
                "containers",
                "container",
                "protocol",
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
                name === "@panel" ? this.containers : {
                    [name]: this.containers[name]
                },
                this.containers[name],
                protocol,
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

            try {
                respose.send(protocol);
            } catch (error) {
                respose.status(500).send(`${error}`);
            }
        });

        return router;
    },
    container(name) {
        return this.openContainer(name);
    }
};