/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const user = await authorize(user => {
    return user.hasPermission({
        "type": "api",
        "api": "container/list"
    });
});

return Object.values(containers).filter(container => {
    return user.hasKey({
        type: "container",
        name: container.name
    })
});