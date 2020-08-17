/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const saveContainers = require("./lib/saveContainers");

const name = await input("name");

if (!name) throw new Error(`Invalid container name`);

const user = await authorize(user => {
    return user.hasPermission({
        "type": "api",
        "api": "container/add"
    }) || user.hasPermission({
        "type": "api",
        "api": "container/upload"
    });
});

if (!user.hasKey({
    type: "container",
    name
})) throw new Error("Container is lock for this user");

protocol.logs.push(`Add container ${name}`);

server.addContainer(name);

await saveContainers(containers);

return "ok";