const name = input("name");

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

await new Promise(resolve => {
    fs.mkdir("temp", { recursive: true }, (error, result) => resolve({ error, result }))
});

const archive = archiver("zip", { zlib: { level: 9 } });

const randomToken = (n = 64, radix = 32) => {
    let token = "";
    while (token.length < n) token += Math.random().toString(radix).slice(2);
    return token.slice(0, n);
}; 

containers[name].token = containers[name].token || randomToken();

const filename = `${name}.${containers[name].token}.zip`;

const stream = fs.createWriteStream(
    path.join(process.cwd(), "temp", filename)
);

console.log(stream);

const result = await new Promise((resolve, reject) => {
    archive.directory(name, false)
        .on("error", error => reject(error))
        .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
});

console.log(result);

return `/temp/${filename}`;