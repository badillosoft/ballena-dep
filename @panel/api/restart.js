setTimeout(async () => {
    await server.restart();
});

return server.serverStartedAt;