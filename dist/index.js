const { Command } = require("commander");
const figlet = require("figlet");
const fs = require("fs");
const path = require("path");
const storage = require("./util/storage");
const settings = require("./util/settings");
const program = new Command();
console.log(figlet.textSync("cli timer"));
program
    .version("1.0.0")
    .description("fast and lightweight CLI timer for speedcubing. Track your solves, get random scrambles, and analyze your times")
    .option("-s, --settings", "Displays the current global settings for the cli timer")
    .parse(process.argv);
const options = program.opts();
if (options.settings) {
    //Displaying the saved data from the 
    console.table(settings.loadSettings());
}
//# sourceMappingURL=index.js.map