const { spawn } = require("child_process");

(async () => {
    const spwannext = async (args = {}) => {
        const process = spawn("node", args.scriptname,args.domain);

        process.stdout.on("data", (data) => {
            console.log(`Output: ${data}`);
        });

        process.stderr.on("data", (data) => {
            console.error(`Error: ${data}`);
        });

        process.on("close", (code) => {
            console.log(`Process exited with code ${code}`);
        });
    }
})()
