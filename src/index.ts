#! /usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";

import {event_choices,events_list} from './events.json'

import {activeWindowSync} from 'get-windows';
import { createTable } from 'nice-table';

import { select,number, input,Separator} from '@inquirer/prompts';
import { plot, Plot } from 'nodeplotlib'
import { spawn } from 'child_process';

import {settings, sessionLog, session_statistics, SolveInstance} from "./util/interfaces"
import * as storage from "./util/storage"
import  * as settingsUtil from "./util/settings"
import path from 'path'
var Scrambow = require('scrambow').Scrambow;
const cfonts = require('cfonts');

import {string as cli_title_string} from './cli-title.json'

const program = new Command();

var saved_data = storage.loadData()

//main_window_id
let main_window_id:number| null = null
//timer variables**********************************

let timer_running:boolean = false

let startTime:[number,number] | null = null

let space_been_pressed:boolean = false
let new_scramble:boolean = false
let solve_labelled:boolean = false

import {GlobalKeyboardListener} from "@futpib/node-global-key-listener";

const listener = new GlobalKeyboardListener();
//*************************************************

console.log(cli_title_string)
function normalizeArg(arg:string):string|null{
    const aliases = {
        fastest_solve: ['f','b','best','fast','fastest','fastest_time'],
        slowest_solve: ['w','s','worst','slow','slowest','slowest_timer'],
        session_mean: ['m','mean','avg','average','session_mean'],
        standard_deviation:['dev','standard_deviation','std.dev','deviation','d'],
        variance:['var','v','variance','var.']
    }
    for(const [key,val] of Object.entries(aliases)){
        if((key === arg) || (val.includes(arg))){
            return key
        }
    }
    return null
}
program
    .version("1.0.15")
    .description("fast and lightweight CLI timer for speedcubing. Cstimer in the command line (in progress)")

program
    .command('graph')
    .argument('<property>','desired statistic to graph')
    .description(`generate a graph of one of the below stats: \n
    session_mean \n
    standard_deviation \n
    variance \n 
    fastest_solve \n
    slowest_solve`)
    .action((property:string)=>{
        const normalized_property:string = normalizeArg(property)

        if(normalized_property !== null){
            const session_data:Map<string,session_statistics> = storage.loadStats().session_data

            if(session_data.size >=0){
                const x_dates:Date[] = Array.from(session_data.keys())
                    .map((ISO_date)=>{
                        return new Date(ISO_date)
                    })

                const y_data:number[] = x_dates.map((date:Date)=>{
                    return session_data.get(date.toISOString())[normalized_property]
                })
                const data: Plot[] = [
                    {
                        x:x_dates,
                        y:y_data,
                        type: 'scatter'
                    }
                ]

                plot(data)
            }else{
                console.log(`error: ` +chalk.red(`Session data.size === 0`))
            }

        }else{
            console.log(chalk.red(`${property}`) + ` is not a valid property. Below are the valid values`)
            console.log("session_mean \n" +
            "standard_deviation \n" +
            "variance \n" +
            "fastest_solve \n" +
            "slowest_solve")
        }
    })

program
    .command('start')
    .argument('[event]', 'the event you wish to practice','333')
    .option('-f, --focusMode','Displays only the most important stats')
    .option('-w --window','Opens a second command prompt window to display the informationa and stats related to the solve')
    .description('Begin a session of practicing a certain event')
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
    })

program
    .command("settings")
    .argument("[property]","configure the cli to your liking")
    .action((setting_to_change:string | undefined)=>{
        let current_settings:settings = settingsUtil.loadSettings()

        const settings_list:string[] = Object.keys(current_settings)
        if(setting_to_change === undefined){
            console.log(chalk.green(`Configure any of the below to some new and preferred value`)) 
            console.table(current_settings)

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


program
    .command('show-session')
    .action(()=>{
        const menu_length:number = 5
        function newChoices(menu_page:number){
            const session_array:sessionLog[] = Array.from(storage.loadData().data.values())

            let menu_choices:any = session_array
            .map((session:sessionLog)=>{
                return {
                    name: session.date_formatted,
                    value: session.date
                }
            }).filter((v,index)=>{
                return (index>=menu_page*(menu_length)) && (index<((menu_page+1)*menu_length))
            })
            
            if(menu_page !== 0){
                menu_choices.unshift({
                    name:chalk.blue(`Back`),
                    value: 'back'
                })
            }
            
            if(session_array[(menu_page+1)*menu_length] !== undefined){
                menu_choices.push({
                    name:chalk.blue(`next`),
                    value: 'next'
                })
            }
            
            select({
                message:`Select the session you'd like to observe`,
                choices:menu_choices
            }).then((value:string)=>{
                switch(value){
                    case 'back':
                        newChoices(menu_page-1)
                        break;
                    case 'next':
                        newChoices(menu_page+1)
                        break;
                    default:
                        const current_session_data:sessionLog = storage.loadData().data.get(value)
                        const current_session_stats:session_statistics = storage.loadStats().session_data.get(value)

                        let info_table = current_session_data.entries.map((instance,index)=>{
                            const label = (instance.label ===  "DNF") ? chalk.red(instance.label) : instance.label
                            return {
                                n: index+1,
                                time: instance.time,
                                label: label ?? chalk.green('OK'),
                            }
                        })
                        console.log(`\n`)
                        console.log(createTable(info_table,['n','time','label']))

                        console.log(Object.keys(current_session_stats).map((key_name:string)=>{
                            return `${key_name}: ${current_session_stats[key_name].toFixed(3)} ${chalk.green('s')}`
                        })
                        .join(chalk.blue('\n')))
                    break;
                }
            }).catch((err)=>{
                console.log(chalk.red(`An error has occurred:${err}`))
            })
        }

        newChoices(0)
    })

program.parse(process.argv)
//const options = program.opts();

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
    main_window_id = activeWindowSync().id

    console.clear()
    const session = Date.now()
    const session_date = new Date(session)
    const session_date_ISO = session_date.toISOString()
    cfonts.say(`session: ${session}`, {
        font: 'tiny',              // define the font face
        align: 'center',              // define text alignment
        colors: ['magenta'],
        background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
        letterSpacing: 1,           // define letter spacing
    });

    const current_settings:settings = settingsUtil.loadSettings()
    
    saved_data.data.set(session_date_ISO,storage.newSessionLog(session_date,event))
    saved_data.last_accessed_log = session_date_ISO

    storage.saveData(saved_data)
    new_scramble = true
    listener.kill()

    if (options.window || options.w) {
        const scriptPath = path.join(__dirname, 'window.js');

        const cmd = spawn('cmd.exe', ['/K', `start cmd /K node ${scriptPath} ${session_date.toISOString()}`], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false
          });
        cmd.unref(); // Allow the parent process to exit without waiting for this new process
        cmd.on('error', (err) => console.error(`Process error: ${err.message}`));
    }
    newSolve(current_settings,event,session_date,options)
}

function newSolve(current_settings:settings,event: string,session_date:Date,option:any):void{
    const session_date_ISO:string = session_date.toISOString()
    var scramble_generator = new Scrambow()
    process.stdin.resume();

    let scramble: string = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string

    process.stdout.write(`\x1b[2K\r`)
    console.log(chalk.bold.red(`Scramble:`))
    process.stdout.write("\x1b[2K")
    console.log(stylizeScramble(scramble))

    listener.addListener(function (e, down) {
        process.stdout.write('\x1b[2K\r');
        
        if(activeWindowSync().id !== main_window_id){
            return
        }

        if((e.name === "D") && (e.state === "UP") && (!new_scramble)){
            const current_session:sessionLog = saved_data.data.get(session_date_ISO)
            if(current_session.entries.length>=1){
                current_session.entries.pop()
                console.log(chalk.blue(`Last solve deleted`))

                saved_data.data.set(session_date_ISO,current_session)
                storage.saveData(saved_data)
            }else{
                console.log(chalk.red(`There exist no entries in the current session to delete`))
            }
            return 
        }
        if((e.name === "N") && (e.state === "UP")){
            if(!new_scramble){
                process.stdout.write('\x1b[2K');
                listener.kill()
                new_scramble = true
                solve_labelled = false
                newSolve(current_settings,event,session_date,option)
            }
            return
        }

        if((e.name === "E") && (e.state === "UP") && (!new_scramble)){
            if(!solve_labelled){
                solve_labelled = true
                const current_session:sessionLog = saved_data.data.get(session_date_ISO)
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

                        saved_data.data.set(session_date_ISO,current_session)
                        storage.saveData(saved_data)

                        console.log(chalk.green(`Last solve labelled ${answer}`))
                        console.log(chalk.bold.magentaBright(`Whenever ready use the spacebar to start a new solve`))

                    }).catch((err)=>{
                        console.log(chalk.red(`An error has occurred:${err}`))
                    })
                }else{
                    console.log(chalk.redBright(`There exist no entries in the current session to label`))
                }
                console.log(`\n \n`)
                return                
            }else{
                console.log(chalk.redBright(`The solve has already been labelled.`))
                return
            }

        }
        if((e.name === "SPACE") && (new_scramble)){
            if(!timer_running){
                if(e.state === "DOWN"){
                    if(!space_been_pressed){
                        space_been_pressed = true
                        process.stdout.write(chalk.bgRed('...') +`\n`);
                    }else{
                        process.stdout.write("\b \b")
                    }
                }else{
                    if(space_been_pressed){
                        space_been_pressed = false
                        process.stdout.write("\x1b[F"); //move back up a line
                        process.stdout.write('\x1b[2K');  // Clear the line
                        console.log(chalk.bgGreenBright('SOLVE') +
                        '\n \n');
                        
                        startTimer()
                    }
                }
            }else{
                if(e.state === "DOWN"){
                    const elapsedTime:number = stopTimer()
                    new_scramble = false
                    
                    const current_session:sessionLog = saved_data.data.get(session_date_ISO)
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
                    const current_Ao5:number = storage.Ao5(current_session)
                    const current_Ao12:number = storage.Ao12(current_session)

                    stats_data.session_data.set(session_date_ISO,current_stats)

                    stats_data.pb_Ao5 = (current_Ao5<stats_data.pb_Ao5) ? current_Ao5 : stats_data.pb_Ao5
                    stats_data.pb_Ao12 = (current_Ao12<stats_data.pb_Ao12) ? current_Ao12 : stats_data.pb_Ao12

                    storage.saveStats(stats_data)
                    saved_data.data.set(session_date_ISO,current_session)
                    storage.saveData(saved_data)

                    process.stdout.write("\b \b")
                    cfonts.say(`${elapsedTime.toFixed(2)}s`, {
                        font: 'block',              // define the font face
                        align: 'center',              // define text alignment
                        colors: ['white'],
                        background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
                        letterSpacing: 1,           // define letter spacing
                    });
                    process.stdout.write("\b \b")
                    console.log( chalk.bold(`Time: `) +  elapsedTime.toFixed(4) + chalk.green('s') +
                    `\n`);
                    
                    console.log(chalk.bold(`Ao5: `)+ chalk.magenta(current_Ao5 ?? "--") + chalk.green(`s`))
                    console.log(chalk.bold(`Ao12: `)+ chalk.magenta(current_Ao12 ?? "--") + chalk.green(`s`) +
                    `\n \n`)

                    if(!(option.focusMode || option.f) && !(option.w || option.window)){
                        //solves
                        console.table(createTable(current_session.entries.map((instance)=>{
                            return {
                                time: instance.time.toFixed(3),
                                label: instance.label ?? 'OK'
                            }
                        }),['time','label']))
                        //stats
                        const titles:string[] = ['average','std. dev.','variance','fastest','slowest']
                        const stats_string:string = Object.keys(current_stats)
                            .map((stat_name:string,index:number)=>{
                                return `${titles[index]}: ${chalk.bold(current_stats[stat_name].toFixed(3))}`
                            })
                            .join(chalk.blue(` | `))
                        
                            console.log(stats_string + `\n`)

                        console.log(`\n`)
                        console.log(chalk.dim(`To label/delete the last solve simply use (`) +
                        chalk.italic.yellow(`e`) + chalk.dim(`/`) + chalk.italic.yellow(`d`) +
                        chalk.dim(`) respectively`))

                        console.log(chalk.dim(`Exit session mode using`), chalk.green(`Ctrl+C`) +
                        `\n`)

                        console.log(chalk.bold.magentaBright(`Whenever ready use the spacebar to start a new solve using`) + chalk.italic.yellow(` n`)+
                        `\n \n`)
                    }
                    //reset
                    timer_running = false
                    startTime = null
                    space_been_pressed = false
                }
            }
            return
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
function stylizeScramble(scramble: string): string {
    const colorMap: Record<string, (s: string) => string> = {
        'r': chalk.redBright,
        'l': chalk.blueBright,
        'u': chalk.cyanBright,
        'd': chalk.greenBright,
        "'": chalk.whiteBright,
        '2': chalk.cyan,
        'F': chalk.magenta.underline,
    };

    return scramble
        .trim()
        .split('')
        .map(char => {
            const stylize = colorMap[char] || chalk.magenta;
            return stylize(char);
        })
        .join('');
}