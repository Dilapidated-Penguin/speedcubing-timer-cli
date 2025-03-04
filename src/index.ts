//const {Command} = require("commander")
//const figlet = require("figlet")
//const chalk = require("chalk")
import figlet from "figlet";
import chalk, { ChalkInstance } from "chalk";
import { Command } from "commander";

import {event_choices,events_list} from './events.json'
 
import { select,number, input} from '@inquirer/prompts';
import {settings, sessionLog, file_data,global_statistics,event_types} from "./util/interfaces"

//const fs = require("fs");
//const path = require("path");
import fs from 'fs'
import path from 'path'


//const storage = require("./util/storage")
//const settingsUtil = require("./util/settings")
import * as storage from "./util/storage"
import  * as settingsUtil from "./util/settings"
import { start } from "repl";

var Scrambow = require('scrambow').Scrambow;

const program = new Command();

var saved_data = storage.loadData()

var keypress = require('keypress');


//timer variables**********************************
const readline = require("node:readline");

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

let timer_running:boolean = false
let space_been_pressed:boolean = false
let startTime:[number,number] | null = null

let keysPressed = new Set();
//*************************************************


console.log(figlet.textSync("cli timer"))
program
    .version("1.0.0")
    .description("fast and lightweight CLI timer for speedcubing. Track your solves, get random scrambles, and analyze your times")
    .option("-s, --settings","Displays the current global settings for the cli timer")

program
    .command('startsession')
    .argument('[event]', 'the event you wish to practice','333')
    .option('-f, --focusMode','')
    .description('Begin a session of practicing this specific event')
    .action((event:string,options:any)=>{
        console.log(event)
        if(event !== undefined){
            const normalized_event = event
                .toLowerCase()
                .trim()
            if(validEvent(normalized_event)){
                startSession(normalized_event,options)
            }else{
                console.log(chalk.red(
                    `${event} is not a valid/supported event`
                ));
            }
        }else{
            
            select({
                message:'Select an event',
                choices:event_choices
            })
            .then((event_choice:string)=>{
                startSession(event_choice,options)
            }).catch((error)=>{
                console.log(chalk.bgRed(`An error occurred`))
            })
        }
        //cubeScramble = cube(Number(event), current_settings.scramble_length).toString()
    })

program
    .command("settings")
    .argument("[property]","configure the cli to your liking")
    .action((setting_to_change:string | undefined)=>{
        let current_settings:settings = settingsUtil.loadSettings()

        const settings_list:string[] = Object.keys(current_settings)
        if(setting_to_change === undefined){
            select({
                message: "Select the setting you'd like to alter",
                choices: settings_list
            }).then((answer:string)=>{
                updateSetting(current_settings,answer)
            })
        }else{
            if(settings_list.indexOf(setting_to_change) !== -1){
                updateSetting(current_settings,setting_to_change)
            }else{
                console.log(chalk.red('Invalid argument:' + chalk.white('The argument is not a setting to change')))
            }
        }

    })


program.parse(process.argv)
const options = program.opts();

if(options.settings){
    
    console.table(settingsUtil.loadSettings())
    console.log(chalk.italic('Use')
    + chalk.green(' cubetimer ')
    + chalk.cyan('settings ')
    + chalk.italic('to change any of the above'))
}

function updateSetting(current_settings:settings,property:string):void{
    const prompt = (typeof current_settings[property] === 'number') ? number : input
    prompt({
        message: `Enter new value for ${property}`,
        default: `${current_settings[property]}` as never
    }).then((new_value:number|string)=>{
        current_settings[property] = new_value
        settingsUtil.saveSettings(current_settings)

        console.log(chalk.green('settings updated!'))
        console.table(current_settings)
    })
}

function validEvent(event_to_check:string):boolean{
    return (events_list.indexOf(event_to_check) !== -1)
}
function startSession(event: string,options:any):void{
    console.clear()
    const session = Date.now()
    const session_date = new Date(session)

    console.log(figlet.textSync('session:'))
    console.log(figlet.textSync(`${session}`))

    const current_settings:settings = settingsUtil.loadSettings()
    //saved_data.data.set(new Date(session_date)

    saved_data.data.set(session_date,storage.newSessionLog(session_date))
    newSolve(current_settings,event,session_date,options)
}
function newSolve(current_settings:settings,event: string,session_date:Date,option:any):void{
    var scramble_generator = new Scrambow()

    let scramble: string = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string

    console.log(stylizeScramble(scramble))

}
function stopTimer():void{
    if (!startTime) return;

    timer_running = false
    const endTime = process.hrtime(startTime)
    const elapsedTime = endTime[0] + endTime[1] / 1e9;
    console.log( chalk.bold(`Time: `) +  elapsedTime.toFixed(4) + chalk.green('s'));
}
function startTimer():void{
    startTime = process.hrtime()
    timer_running = true
}
function stylizeScramble(scramble:string):string{
    return scramble
    .trim()
    .split('')
    .reduce((acc,curr)=>{
        switch(curr){
            case 'r':
                return acc += chalk.redBright(curr)
            case 'l':
                return acc += chalk.blueBright(curr)
            case 'u':
                return acc += chalk.cyanBright(curr)
            case 'd':
                return acc += chalk.greenBright(curr)
            case `'`:
                return acc += chalk.whiteBright(curr)
            case '2':
                return acc += chalk.cyan(curr)
            case 'F':
                return acc += chalk.magenta.underline(curr)
            default:
                return acc += chalk.magenta(curr)
        }  
        
    },'')
}