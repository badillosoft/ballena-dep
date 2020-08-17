/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const fs = require("fs");
const path = require("path");

const archiver = require("archiver");

module.exports = async (filename, name, dir = "temp") => {

    await new Promise(resolve => {
        fs.mkdir(dir, { recursive: true }, (error, result) => resolve({ error, result }))
    });

    const archive = archiver("zip", { zlib: { level: 9 } });

    const stream = fs.createWriteStream(
        path.join(process.cwd(), dir, filename)
    );

    // console.log(stream);

    await new Promise((resolve, reject) => {
        archive.directory(name, false)
            .on("error", error => reject(error))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });

    // console.log(result);

    return `/${dir}/${filename}`;
}