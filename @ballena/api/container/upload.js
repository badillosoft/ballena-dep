/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const path = require("path");
const extract = require("extract-zip");

const name = input("name");
const url = input("url");

if (/^\s*$|^@ballena$/.test(name)) throw new Error("El nombre del contenedor no es válido");

const source = path.join(process.cwd(), url);
const target = path.join(process.cwd(), name);

await extract(source, {
    dir: target
});

return "ok"