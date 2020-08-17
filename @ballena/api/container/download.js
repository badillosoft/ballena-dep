/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const zipContainer = require("./lib/zipContainer");

const name = input("name");

const randomToken = (n = 64, radix = 32) => {
    let token = "";
    while (token.length < n) token += Math.random().toString(radix).slice(2);
    return token.slice(0, n);
};

containers[name].token = containers[name].token || randomToken();

const filename = `${name}.${containers[name].token}.zip`;

const downloadUrl = await zipContainer(filename, name);

return downloadUrl;