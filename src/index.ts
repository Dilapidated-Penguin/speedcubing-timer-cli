import figlet from "figlet";
import chalk, { ChalkInstance } from "chalk";
import { Command } from "commander";

import {event_choices,events_list} from './events.json'
 
import { select,number, input} from '@inquirer/prompts';
import {settings, sessionLog, file_data,global_statistics,event_types, session_statistics} from "./util/interfaces"

import fs from 'fs'
import path from 'path'


import * as storage from "./util/storage"
import  * as settingsUtil from "./util/settings"
import { start } from "repl";

var Scrambow = require('scrambow').Scrambow;

const program = new Command();

var saved_data = storage.loadData()


//timer variables**********************************

//process.stdin.setRawMode(true);

let timer_running:boolean = false

let startTime:[number,number] | null = null

let space_been_pressed:boolean = false

import {GlobalKeyboardListener} from "@futpib/node-global-key-listener";
const listener = new GlobalKeyboardListener();
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
    
    saved_data.data.set(session_date,storage.newSessionLog(session_date,event))
    saved_data.last_accessed_log = session_date

    storage.saveData(saved_data)
    newSolve(current_settings,event,session_date,options)
}
function newSolve(current_settings:settings,event: string,session_date:Date,option:any):void{
    var scramble_generator = new Scrambow()
    process.stdin.resume();

    let scramble: string = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string

    console.log(stylizeScramble(scramble))
    
    listener.addListener(function (e, down) {
        
        if((e.name === "D") && (e.state === "DOWN")){
            const current_session:sessionLog = saved_data.data.get(session_date)
            if(current_session.entries.length>=1){
                current_session.entries.pop()
                console.log(chalk.blue(`Last solve deleted`))

                saved_data.data.set(session_date,current_session)
                storage.saveData(saved_data)
            }else{
                console.log(chalk.red(`There exist no entries in the current session to delete`))
            }
        }
        if((e.name === "E") && (e.state === "DOWN")){
            const current_session:sessionLog = saved_data.data.get(session_date)
            console.log(`\n \n`)
            if(current_session.entries.length>=1){
                select({
                    message:`Select the label for the previous solve`,
                    choices:[
                        '+3',
                        'DNF',
                        'OK'
                    ]
                }).then((answer:string)=>{
                    current_session.entries.at(-1).label = answer

                    saved_data.data.set(session_date,current_session)
                    storage.saveData(saved_data)
                    console.log(chalk.green(`Last solve labelled ${answer}`))
                    console.log(chalk.bold.magentaBright(`Whenever ready use the spacebar to start a new solve`))

                }).catch((err)=>{
                    console.log(chalk.red(`An error has occurred`))
                })
            }else{
                console.log(chalk.red(`There exist no entries in the current session to label`))
            }
            console.log(`\n \n`)
        }
        if((e.name === "SPACE")){
            if(!timer_running){
                if(e.state === "DOWN"){
                    if(!space_been_pressed){
                        space_been_pressed = true
                        process.stdout.write(chalk.bgRed('...'));
                    }else{
                        process.stdout.write("\b \b")
                        //potential patch for space
                    }
                }else{
                    if(space_been_pressed){
                        space_been_pressed = false
                        process.stdout.write('\x1b[2K');  // Clear the line
                        console.log(chalk.bgGreenBright('SOLVE') +
                        '\n \n');
                        startTimer()
                    }
                }
            }else{
                if(e.state === "DOWN"){
                    const elapsedTime:number = stopTimer()
                    const current_session:sessionLog = saved_data.data.get(session_date)
                    current_session.entries.push({
                        scramble: scramble,
                        time: elapsedTime,
                        label: null
                    })
                    const session_average = current_session
                        .entries
                        .reduce((acc,curr)=>{
                            return acc += curr.time
                        },0)/current_session.entries.length

                    const best_time:number = current_session
                        .entries
                        .reduce((acc,curr)=>{
                            if(acc<curr.time){
                                return acc
                            }else{
                                return curr.time
                            }
                        },Infinity)
                    const worst_time:number = current_session
                    .entries
                    .reduce((acc,curr)=>{
                        if(acc>curr.time){
                            return acc
                        }else{
                            return curr.time
                        }
                    },-Infinity)
                    const variance:number = current_session
                        .entries
                        .reduce((acc,curr)=>{
                            return acc += (session_average - curr.time)**2 
                        },0)/current_session.entries.length

                    const stats_data = storage.loadStats()
                    const current_stats:session_statistics = {
                        session_mean: session_average,
                        standard_deviation: Math.sqrt(variance),
                        variance: variance,
                        fastest_solve: best_time,
                        slowest_solve: worst_time
                    }
                    stats_data.session_data.set(session_date,current_stats)
                    storage.saveStats(stats_data)
                    saved_data.data.set(session_date,current_session)
                    storage.saveData(saved_data)

                    
                    console.log( chalk.bold(`Time: `) +  elapsedTime.toFixed(4) + chalk.green('s') +
                    `\n`);
                    
                    console.log(chalk.bold(`Ao5: `)+ chalk.magenta(storage.Ao5(current_session) ?? "--") + chalk.green(`s`))
                    console.log(chalk.bold(`Ao12: `)+ chalk.magenta(storage.Ao12(current_session)?? "--") + chalk.green(`s`) +
                    `\n \n`)
                    //check if Ao5/12 are the best 

                    if(!option.focusMode){
                        //table of stats
                        const stats_table = {
                            "mean": `${current_stats.session_mean}` + chalk.green(`s`),
                            "𝜎": chalk.blue(current_stats.standard_deviation),
                            "𝜎^2":current_stats.variance,
                            "best": chalk.green(`${current_stats.fastest_solve}s`),
                            "worst": `${current_stats.slowest_solve}` + chalk.green(`s`)
                        }
                        console.table(stats_table,["mean","𝜎","𝜎^2","best","worst"])

                        console.log(`\n`)
                        console.log(chalk.dim(`To label/delete the last solve simply use`) +
                        chalk.italic.yellow(` e`) + chalk.dim(`/`) + chalk.italic.yellow(`d`) +
                        chalk.dim(` respectively`))

                        console.log(chalk.dim(`Exit session mode using`), chalk.green(`Ctrl+C`) +
                        `\n`)

                        console.log(chalk.bold.magentaBright(`Whenever ready use the spacebar to start a new solve`) +
                        `\n \n`)
                    }
                    //reset
                    timer_running = false
                    startTime = null
                    space_been_pressed = false
                }
            }
        }
    });
}
function stopTimer():number{
    if (!startTime) return;

    timer_running = false
    const endTime = process.hrtime(startTime)
    return  endTime[0] + endTime[1] / 1e9;
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