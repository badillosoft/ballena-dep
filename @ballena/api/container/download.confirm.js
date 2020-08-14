/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const name = input("name");

const fs = require("fs");
const path = require("path");

const filename = `${name}.${containers[name].token}.zip`;

await new Promise((resolve, reject) => {
    fs.unlink(path.join(process.cwd(), "temp", filename), (error, result) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(result);
    });
});

return `/temp/${filename}`;