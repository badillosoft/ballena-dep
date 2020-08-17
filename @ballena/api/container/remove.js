/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const name = await input("name");

if (name === "@ballena") throw new Error("Can not close this container");

if (!name) throw new Error(`Invalid container name`);

const user = await authorize(user => {
    return user.hasPermission({
        "type": "api",
        "api": "container/remove"
    });
});

if (!user.hasKey({
    type: "container",
    name
})) throw new Error("Container is lock for this user");

protocol.logs.push(`Load container ${name}`);

server.removeContainer(name);

delete containers[name];

const fs = require("fs");
const path = require("path");

await new Promise(resolve => {
    fs.mkdir(".ballena", { recursive: true }, (error, result) => resolve({ error, result }))
});

await new Promise((resolve, reject) => {
    fs.writeFile(
        path.join(process.cwd(), ".ballena", "containers.json"),
        JSON.stringify(containers, null, 4), "utf-8",
        (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        }
    );
});

return "ok";