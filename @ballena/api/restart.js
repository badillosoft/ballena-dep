/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

setTimeout(async () => {
    await server.restart();
});

return server.serverStartedAt;