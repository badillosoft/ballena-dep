/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const name = input("name");

const user = await authorize(user => {
    return user.hasPermission({
        "type": "api",
        "api": "container/download"
    });
});

if (!user.hasKey({
    type: "container",
    name
})) throw new Error("Container is lock for this user");

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