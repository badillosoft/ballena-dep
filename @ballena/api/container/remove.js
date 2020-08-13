/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const name = await input("name");

if (!name) throw new Error(`Invalid container name`);

protocol.logs.push(`Load container ${name}`);

server.removeContainer(name);

return "ok";