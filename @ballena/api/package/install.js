const name = await input("name");

if (!name) throw new Error("Invalid package name");

const util = require("util");
const child_process = require("child_process");
const exec = util.promisify(child_process.exec);

const { stdout, stderr } = await exec(`npm install --save ${name}`);

console.log("stdout:", stdout);
console.log("stderr:", stderr);

return {
    stdout,
    stderr
}