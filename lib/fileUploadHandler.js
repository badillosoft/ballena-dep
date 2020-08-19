/*
 * Copyright (c) 2020 Alan Badillo Salas <dragonnomada@gmail.com>
 * MIT Licensed
 */

const fs = require("fs");
const path = require("path");

const { v4: uuid } = require("uuid");

module.exports = async request => {
    await new Promise(resolve => {
        fs.mkdir(path.join(process.cwd(), "files"), resolve);
    });

    const files = await new Promise(resolve => {
        if (!request.busboy) {
            resolve([]);
            return;
        }

        const files = [];

        let count = 0;

        request.busboy.on("file", async (_, file, filename) => {
            count++;
            const id = uuid();
            const ext = `${(filename.match(/\.\w+$/) || [".bin"])[0]}`;
            const name = `${id}${ext}`;
            const baseUrl = `file`;
            const url = `${baseUrl}/${name}`;
            const fstream = fs.createWriteStream(path.join(process.cwd(), "files", name));
            fstream.on("close", () => {
                count--;
                files.push({
                    id,
                    filename,
                    name,
                    baseUrl,
                    url,
                    ext
                });
            });
            file.pipe(fstream);
        });

        request.busboy.on("finish", async () => {
            while (count > 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            resolve(files);
        });

        try {
            request.pipe(request.busboy);
        } catch (error) {
            resolve([]);
        }
    });
    return files;
};