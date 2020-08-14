/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const name = await input("name");

if (name === "@ballena") throw new Error("Este contenedor no se puede cerrar");

if (!name) throw new Error(`Invalid container name`);

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