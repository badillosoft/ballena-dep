/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const url = input("url");

await authorize(user => {
    return user.hasPermission({
        "type": "api",
        "api": "container/upload"
    });
});

const fs = require("fs");
const path = require("path");

await new Promise((resolve, reject) => {
    fs.unlink(path.join(process.cwd(), url), (error, result) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(result);
    });
});

return "ok";