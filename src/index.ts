const {Command} = require("commander")
const figlet = require("figlet")
const chalk = require("chalk")
//const {inquirer,select} = require("@inquirer/prompts")
import { select } from '@inquirer/prompts';

const fs = require("fs");
const path = require("path");

const storage = require("./util/storage")
const settingsUtil = require("./util/settings")


const program = new Command();

console.log(figlet.textSync("cli timer"))
program
    .version("1.0.0")
    .description("fast and lightweight CLI timer for speedcubing. Track your solves, get random scrambles, and analyze your times")
    .option("-s, --settings","Displays the current global settings for the cli timer")
    .parse(process.argv)

program
    .Command('startsession')
    .argument('[event]', 'the event you wish to practice','3x3')
    .option('-f, --focusMode','')
    .description('Begin a session of practicing this specific event')
    .action((event,options)=>{

    })

program
    .Commmand("settings")
    .argument("[property]","configure the cli to your liking")
    .action((setting_to_change)=>{
        const settings = settingsUtil.loadSettings()

    })

const options = program.opts();

if(options.settings){
    
    console.table(settingsUtil.loadSettings())
    console.log(chalk.italic('Use')
    + chalk.green('cubetimer ')
    + chalk.cyan('settings')
    + chalk.italic('to change any of the above'))
}
