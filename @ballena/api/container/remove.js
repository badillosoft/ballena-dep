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

return "ok";