/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const path = require("path");

const extract = require("extract-zip");

const name = input("name");
const url = input("url");

if (/^\s*$|^@ballena$/.test(name || "")) throw new Error("El nombre del contenedor no es válido");

const user = await authorize(user => {
    return user.hasPermission({
        "type": "api",
        "api": "container/upload"
    });
});

if (!user.hasKey({
    type: "container",
    name
})) throw new Error("Container is lock for this user");

const zipContainer = require("./lib/zipContainer");

filename = `${name}.${new Date().toISOString().slice(0, 19).replace(/T|\-|\:/g, ".")}.zip`;

await zipContainer(filename, name, "backup");

const source = path.join(process.cwd(), url);
const target = path.join(process.cwd(), name);

await extract(source, {
    dir: target
});

return "ok"