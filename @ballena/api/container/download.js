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

const zipContainer = require("./lib/zipContainer");

const randomToken = (n = 64, radix = 32) => {
    let token = "";
    while (token.length < n) token += Math.random().toString(radix).slice(2);
    return token.slice(0, n);
};

containers[name].token = containers[name].token || randomToken();

const filename = `${name}.${containers[name].token}.zip`;

const downloadUrl = await zipContainer(filename, name);

return downloadUrl;