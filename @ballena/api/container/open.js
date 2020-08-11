const name = await input("name");

if (!name) throw new Error(`Invalid container name`);

protocol.logs.push(`Load container ${name}`);

server.container(name);

return "ok";