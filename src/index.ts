#! /usr/bin/env node
import chalk, { chalkStderr } from "chalk";
import { Command } from "commander";

import {event_choices,events_list} from './events.json'

import {activeWindowSync, Result} from 'get-windows';
import { createTable } from 'nice-table';

import { select,number, input} from '@inquirer/prompts';import { spawn } from 'child_process';

import {settings, sessionLog, session_statistics, SolveInstance} from "./util/interfaces"
import * as storage from "./util/storage"
import  * as settingsUtil from "./util/settings"
import {playAudioFile} from './util/sound'
import {startLoader, endLoader} from './util/loading'
import { plot, Plot,Layout } from 'nodeplotlib';
import path from 'path'

const readline = require('readline');

var Scrambow = require('scrambow').Scrambow;
const cfonts = require('cfonts');

import * as title from './cli-title.json'

const program = new Command();

var saved_data = storage.loadData()

//main_window_id
const main_window_id:number = activeWindowSync().id
//timer variables**********************************

let timer_running:boolean = false

let startTime:[number,number] | null = null

let space_been_pressed:boolean = false
let new_scramble:boolean = false
let solve_labelled:boolean = false

import {GlobalKeyboardListener} from "@futpib/node-global-key-listener";

import { clearInterval } from "timers";
import { PlotData } from "plotly.js";
import fs from 'fs'
const listener = new GlobalKeyboardListener();
//*************************************************

//*************************************************


if(title.previous_window!==main_window_id){
    console.log(title.string)
    let res = JSON.parse(JSON.stringify(title))
    res.previous_window = main_window_id

    const title_path = path.join(__dirname, './cli-title.json');
    fs.writeFileSync(title_path,JSON.stringify(res))
}


program
    .version("1.0.39")
    .description("fast and lightweight CLI timer for speedcubing. Cstimer in the command line (in progress)")


program
    .command('graph')
    .argument('<property>','desired statistic to graph')
    .option('-c, --console','Displays the graph in the console')
    .description(`generate a graph of one of the below stats: \n
    session_mean \n
    standard_deviation \n
    variance \n 
    fastest_solve \n
    slowest_solve`)
    .action((property:string,options:any)=>{
        const property_keys = ['fastest_solve','session_mean','standard_deviation','variance','slowest_solve','all'] as const;
        type propertyKey = typeof property_keys[number]

        function normalizeArg(arg:string):propertyKey | null{
            const aliases = {
                fastest_solve: ['f','b','best','fast','fastest','fastest_time'],
                slowest_solve: ['w','s','worst','slow','slowest','slowest_timer'],
                session_mean: ['m','mean','avg','average','session_mean'],
                standard_deviation:['dev','standard_deviation','std.dev','deviation','d'],
                variance:['var','v','variance','var.'],
                all:['a']
            }
        
            for(const [key,val] of Object.entries(aliases)){
                if((key === arg) || (val.includes(arg))){
                    return key as keyof session_statistics
                }
            }
            return null
        }

        const normalized_property:propertyKey = normalizeArg(property)
        
        if(normalized_property !== null){
            const session_data:Map<string,session_statistics> = storage.loadStats().session_data

            if(session_data.size >=0){

                const x_dates:Date[] = Array.from(session_data.keys())
                    .map((ISO_date)=>{
                        return new Date(ISO_date)
                    })
                const retrieve_data = (property:propertyKey,console_option:boolean = true)=>{
                    const y_data:number[] = x_dates.map((date:Date)=>{
                        return session_data.get(date.toISOString())[property]
                    })
                
                    return console_option ? {
                        x:x_dates,
                        y:y_data,
                    } : {
                        x:x_dates,
                        y:y_data,
                        type:'scatter'
                    }
                }

                function consoleGraph(prop:string){
                    const allGraph = ()=>{
                        function randomColor() {
                            return [Math.random() * 255,Math.random()*255, Math.random()*255]
                        }
                        const global_line = contrib.line(
                            { 
                            xLabelPadding: 3,
                            xPadding: 5,
                            label: 'Graph title',
                            showLegend:true,
                            width:'100%',
                            height:'100%'
                        })
                        screen.append(global_line)
                        let global_data = []

                        const new_line = (prop:string)=>{
                            const {x,y} = retrieve_data(prop as keyof session_statistics)
                            const random_colour = randomColor()
                            const style = {
                                line: random_colour,
                                text:random_colour
                            }

                            global_data.push({
                                x:x,
                                y:y,
                                title:prop,
                                style:style
                            })

                        }
                        
                        property_keys.map((property:propertyKey)=>{
                            new_line(property)
                        })

                        global_line.setData(global_data)

                    }
                    const defaultGraph = ()=>{
                        const line = contrib.line(
                            { style:
                              { line: "yellow"
                              , text: "green"
                              , baseline: "black"}
                            , xLabelPadding: 3
                            , xPadding: 5
                            , label: `${normalized_property}(s)`})
                        let prop_data = retrieve_data(normalized_property as keyof session_statistics)
                        screen.append(line) //must append before setting data
                        line.setData([prop_data])

                    }

                    let resGraph = (graphFunc)=>{
                        graphFunc()

                        screen.key(['escape', 'q', 'C-c'], function(ch, key) {
                            return process.exit(0);
                        });

                        screen.render()
                    }
                    return resGraph((prop === 'all')?allGraph:defaultGraph)
                }

                if(options.console){
                    var blessed = require('blessed')
                    , contrib = require('blessed-contrib')
                    , screen = blessed.screen()

                    consoleGraph(normalized_property)
                }else{
                    switch(normalized_property){
                        case 'all':
                            const data:Plot[] = property_keys.map((property:propertyKey)=>{
                                const res =retrieve_data(property,false)
                                return res as PlotData
                            })
                            plot(data)
                        break;
                        default:
                            plot([retrieve_data(normalized_property as keyof session_statistics,false) as PlotData])
                        break;
                    }
                }

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
    .command('scramble')
    .argument('<format>',`Format of the scramble(s) you'd like to generate`)
    .argument('[number]','number of scrambles to generate','1')
    .argument('[length]',`Length of the scramble`)
    .description('Generate a scramble')
    .action((event:string,count:string,length:string)=>{
        const normalized_event:string = event
            .toLowerCase()
            .trim()

        if(!validEvent(normalized_event)){
            console.log(chalk.redBright(`invalid event`))
            return
        }

        count = count
            .toLowerCase()
            .trim()

        const current_settings:settings = settingsUtil.loadSettings()
        const scramble_length:number = Number(length) ?? current_settings.scramble_length

        if((scramble_length<=0) || (scramble_length>40)){
            console.log(chalk.red(`invalid length`))
            return
        }

        var scramble_generator = new Scrambow()
        const get_scramble_string = async (count:string) => {
            return scramble_generator
            .setType(normalized_event)
            .setLength(scramble_length)
            .get(Number(count))
            .map((scramble_object,index)=>{
            return `${index+1}) ${stylizeScramble(scramble_object.scramble_string)}`

            })
            .join(`\n`)
        }

        startLoader()
        get_scramble_string(count).then((scramble_string:string)=>{
            console.log(scramble_string)

        }).catch((err)=>{
            console.log(err)
        }).finally(()=>{
            endLoader()
        })
    
    })

program
    .command('start')
    .argument('[event]', 'the event you wish to practice','333')
    .option('-f, --focusMode','Displays only the most important stats')
    .option('-w, --window','Opens a second command prompt window to display the informationa and stats related to the solve')
    .option('-i,--inspect','add inspection time')
    .description('Begin a session of practicing a certain event')
    .action((event:string,options:any)=>{
        
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
    .command('metronome')
    .argument('[bpm]','the bpm of the metronome',settingsUtil.loadSettings().default_bpm)
    .description('start a metronome')
    .action((bpm:string)=>{

        function metronome(bpm:number){
            const interval:number = 60000/bpm
            const file_path = path.join(__dirname,`/sounds/${settingsUtil.loadSettings().default_metronome}`)

            setInterval(()=>{
                playAudioFile(file_path)
            },interval)
        }
        
        const bpm_number:number = Number(bpm)
        if(isNaN(bpm_number)){
            console.log(chalk.red(bpm) + ` is not a number`)
            return 
        }
        if((bpm_number<3) || (bpm_number>180)){
            console.log(`${chalk.red(bpm)}< 3bpm || ${chalk.red(bpm)}>180bpm`)
            return
        }
        console.log(`bpm: ` + chalk.bold(bpm))
        console.log(`Use ` + chalk.bold(`Ctrl + C`) + ` to exit the metronome`)
        metronome(bpm_number)

    })

program
    .command("settings")
    .argument("[property]",'configure the cli to your liking')
    .description('configure the cli to your liking')
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
    .description(`Shows a list of session date markers`)
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

                        let info_table = current_session_data.entries.map((instance,index)=>{
                            const label = (instance.label ===  "DNF") ? chalk.red(instance.label) : instance.label
                            return {
                                n: index+1,
                                time: instance.time.toFixed(settingsUtil.loadSettings().sig_fig),
                                label: label ?? chalk.green('OK'),
                            }
                        })
                        console.log(`\n`)
                        console.log(createTable(info_table,['n','time','label']))

                        const current_sesssion_stats:session_statistics = storage.loadStats().session_data.get(value)

                        if(current_sesssion_stats !== undefined){
                            console.log(`${chalk.green(current_session_data.date_formatted)}\n Event:${current_session_data.event} \n`)

                            console.log(Object.keys(current_sesssion_stats).map((stat_name:string)=>{
                                return `${chalk.yellowBright(stat_name)}: ${current_sesssion_stats[stat_name]}${chalk.green('s')} \n`
                            }).join(''))

                        }else{
                            console.log(`Statistics unavailable`)
                        }

                    break;
                }
            }).catch((err)=>{
                console.log(chalk.red(`An error has occurred:${err}`))
            })
        }

        newChoices(0)
    })

program.parse(process.argv)

function updateSetting(current_settings:settings,property:string):void{
    switch(property){
        case 'default_metronome':
            const fs = require('node:fs');
            const sounds_path = path.join(__dirname,`./sounds`)

            let sound_names:string[] = fs.readdirSync(sounds_path)
            const current_sound_index = sound_names.findIndex(u => u === current_settings.default_metronome)
            sound_names[current_sound_index] = chalk.bold(sound_names[current_sound_index])

            select({
                message:`Select the sound of the metronome`,
                choices:sound_names
            }).then((sound_name:string)=>{
                current_settings.default_metronome = sound_name
                settingsUtil.saveSettings(current_settings)
                console.log(chalk.green(`Metronome sound setting updated`))
            }).catch((err)=>{
                console.log(err)
            })
            break;
        default:
            let prompt 
            console.log(typeof current_settings[property])
            switch(typeof current_settings[property]){
                case 'number': prompt = number
                case 'string': prompt = input
            }
            
            prompt({
                message: `Enter new value for ${property}`,
                default: current_settings[property] as never
            }).then((new_value:string|number)=>{
                const num_value:number  = Number(new_value)
                if(!isNaN(num_value)){
                    current_settings[property] = num_value
                }else{
                    current_settings[property] = `${new_value}`
                }

                settingsUtil.saveSettings(current_settings)
        
                console.log(chalk.green('settings updated!'))
                console.table(current_settings)
            })
            break;
    }
}

function validEvent(event_to_check:string):boolean{
    return (events_list.indexOf(event_to_check) !== -1)
}
function startSession(event: string,options:any):void{

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

    let lines_after_counter:number = 0

    let scramble: string = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string
        

    process.stdout.write(`\x1b[2K\r`)
    console.log(chalk.bold.red(`Scramble:`))
    process.stdout.write("\x1b[2K")
    console.log(stylizeScramble(scramble) + '\n')

    const pressedState = ()=>{
        space_been_pressed = true
        belowCounter(chalk.bgRed('...'))
    }

    const belowCounter = (text:string)=>{
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0)
        process.stdout.write(`${text}\n`)
        readline.cursorTo(process.stdout, 0)
        lines_after_counter++
        return lines_after_counter
    }
    function newSolvePrompt(){
        console.log(`\n`)
        console.log(chalk.dim(`To label/delete the last solve simply use (`) +
        chalk.italic.yellow(`e`) + chalk.dim(`/`) + chalk.italic.yellow(`d`) +
        chalk.dim(`) respectively`))

        console.log(chalk.dim(`Exit session mode using`), chalk.green(`Ctrl+C`) +
        `\n`)

        console.log(chalk.bold.magentaBright(`Whenever ready use the spacebar to start a new solve using`) + chalk.italic.yellow(` n`)+
        `\n \n`)
    }
    function inspection_time(inspection_time:number = 15){

        let count:number = -1
        space_been_pressed  = false
        let timer_started:boolean = false
        let intervalid
        belowCounter(`tap the ${chalk.underline(`Spacebar`)} to start the inspection timer`)
        listener.addListener(function (e, down) {
            if((e.name === "SPACE")){
                if(e.state === "DOWN"){
                    if(timer_started){
                        if(!space_been_pressed){
                            pressedState()
                        }
                    }

                }else{
                    if(!timer_started){
                        timer_started = true
                        startInspectionTimer()
                        belowCounter(chalk.underline(`inspection started`))
                    }
                    if(space_been_pressed && timer_started){
                        clearInterval(intervalid)

                        listener.kill()
                        new_scramble = true
                        space_been_pressed = true
                        solve_labelled = false

                        startListener(current_settings,event,session_date,option)
                    }
                }
            }
        })
        function startInspectionTimer(){
            intervalid = global.setInterval(()=>{
                count++
                const colour_gradient:number =  1-((inspection_time-count)/inspection_time)

                const red = (gradient)=>{
                    return Math.round(255*gradient)
                }
                const green = (gradient)=>{
                    return Math.round(-255*(gradient) + 255)
                }
                let colour = chalk.rgb(red(colour_gradient),green(colour_gradient),0)
    
                //udpate the timer
                const updateTimer = (time:number, lines_after_counter:number)=>{
                    readline.cursorTo(process.stdout, 0)
                    readline.moveCursor(process.stdout, 0, -lines_after_counter- 1);
                    readline.clearLine(process.stdout, 0);
                    process.stdout.write(`${colour(`${time-count}`)}`);
                    readline.moveCursor(process.stdout, 0, lines_after_counter+ 1);
                    readline.cursorTo(process.stdout, 0)
                }
                updateTimer(inspection_time,lines_after_counter)


                if(count >= inspection_time){
                    if(count = inspection_time){
                        listener.kill()
                        clearInterval(intervalid)
     
                        newSolvePrompt()
                        
                        listener.kill()
                        new_scramble = true
                        solve_labelled = false
                        space_been_pressed = false

                        newSolve(current_settings,event,session_date,option)
                    }
                }
            },1000)
        }

    
    }
    if(option.i || option.inspect){
        inspection_time(current_settings.inspection_sec)
    }else{
        startListener(current_settings,event,session_date,option)
    }
    function startListener(current_settings:settings,event: string,session_date:Date,option:any){
        const inspect:boolean = option.i || option.inspect
        const releasedState = ()=>{
            space_been_pressed = false

            readline.moveCursor(process.stdout, 0,-(inspect ? 1:2));
            readline.cursorTo(process.stdout, 0)
            readline.clearLine(process.stdout, 0)
            process.stdout.write(chalk.bgGreenBright('SOLVE') +
            '\n \n')
            readline.cursorTo(process.stdout, 0)

            startTimer()
        }
    
        if(inspect){
            if(space_been_pressed){
                releasedState()
            }
        }
        listener.addListener(function (e, down) {
            const edit_selected = (date_ISO:string)=>{
                number({
                    message:`Enter the index of the solve you'd like to change`,
                    default:1
                }).then((index_to_alter:number)=>{
                    const current_session:SolveInstance[] = saved_data.data.get(date_ISO).entries
                    if((index_to_alter < 0) || (index_to_alter>current_session.length)){
                        console.log(chalk.red('invalid index'))
                        return
                    }
                    const selected_entry:SolveInstance = current_session.at(index_to_alter)
                    
                    
                    console.log(Object.keys(selected_entry).map((key)=>{
                        return `${key}: ${chalk.green(selected_entry[key])}`
                    })
                    .join(''))
                    select({
                        message:`Label or delete`,
                        choices:['label','delete']
                    }).then((answer:string)=>{
                        switch(answer){
                            case 'label':
                                editEntry(date_ISO,index_to_alter)
                            break;
                            case 'delete':
                                deleteEntry(date_ISO,index_to_alter)
                            break;
                        }
                    }).catch((err)=>{
                        console.log(err)
                    })
                }).catch((err)=>{
                    console.log(err)
                })
            }
            const deleteEntry =  (date_ISO:string,index_to_delete:number = null)=>{
                let current_session:sessionLog = saved_data.data.get(date_ISO)
                if(current_session.entries.length>=1){
                    if(index_to_delete === null){
                        current_session.entries.pop()
                        console.log(chalk.blue(`Last solve deleted`))
                    }else{
                        current_session.entries = current_session.entries.filter((d,index)=> index !==index_to_delete)
                        console.log(`Session ${index_to_delete} deleted`)
                    }

                    saved_data.data.set(date_ISO,current_session)
                    storage.saveData(saved_data)
                }else{
                    console.log(chalk.red(`There exist no entries in the current session to delete`))
                }
            }
            const editEntry = (date_ISO:string,index_to_edit:number = null)=>{
                const current_session:sessionLog = saved_data.data.get(date_ISO)
                if(current_session.entries.length>=1){   
                    const editing_last_solve:boolean = index_to_edit === null
                    const entry_message:string = editing_last_solve ? `Select the label for the previous solve` : `Select the label for solve #${index_to_edit}`
                    select({
                        message:entry_message,
                        choices:[
                            '+3',
                            'DNF',
                            'OK'
                        ]
                    }).then((answer:string)=>{
                        const index:number = editing_last_solve ? -1 : index_to_edit+1
                        current_session.entries.at(index).label = answer

                        saved_data.data.set(date_ISO,current_session)
                        storage.saveData(saved_data)

                        console.log(chalk.green(`Last solve labelled ${answer}`))
                        console.log(chalk.bold.magentaBright(`Whenever ready use the spacebar to start a new solve`))

                    }).catch((err)=>{
                        console.log(chalk.red(`An error has occurred:${err}`))
                    })
                }else{
                    console.log(chalk.redBright(`There exist no entries in the current session to label`))
                }
            }
            if(activeWindowSync()?.id !== main_window_id){
                return
            }
    
            if((e.name === "D") && (e.state === "UP") && (!new_scramble)){
                deleteEntry(session_date_ISO)
                return 
            }
            if((e.name === "N") && (e.state === "UP")){
                if(!new_scramble){
                    process.stdout.write('\x1b[2K');
                    listener.kill()
                    new_scramble = true
                    solve_labelled = false
                    space_been_pressed = false
                    newSolve(current_settings,event,session_date,option)
                }
                return
            }
    
            if((e.name === "E") && (e.state === "UP") && (!new_scramble)){
                if(!solve_labelled){
                    solve_labelled = true
                    console.log(`\n \n`)
                    editEntry(session_date_ISO)
                }else{
                    console.log(chalk.redBright(`The solve has already been labelled.`))
                }
                return
            }


            if((e.name === "SPACE") && (new_scramble)){
                if(!timer_running){
                    if(e.state === "DOWN"){
                        if(!space_been_pressed){
                            pressedState()
                            process.stdout.write("\n")
                        }else{
                            process.stdout.write("\b \b")
                        }
                    }else{
                        if(space_been_pressed){
                            releasedState()
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
                        const sig_fig:number = settingsUtil.loadSettings().sig_fig
                        console.log( chalk.bold(`Time: `) +  elapsedTime.toFixed(sig_fig) + chalk.green('s') +
                        `\n`);
                        
                        console.log(chalk.bold(`Ao5: `)+ chalk.magenta(current_Ao5 ?? "--") + chalk.green(`s`))
                        console.log(chalk.bold(`Ao12: `)+ chalk.magenta(current_Ao12 ?? "--") + chalk.green(`s`) +
                        `\n \n`)
    
                        if(!(option.focusMode || option.f) && !(option.w || option.window)){
                            //solves
                            console.table(createTable(current_session.entries.map((instance)=>{
                                return {
                                    time: instance.time.toFixed(sig_fig),
                                    label: instance.label ?? 'OK'
                                }
                            }),['time','label']))
                            //stats
                            const generateStatString = (current_stats:session_statistics)=>{
                                const titles:string[] = ['average','std. dev.','variance','fastest','slowest']
                                return Object.keys(current_stats)
                                    .map((stat_name:string,index:number)=>{
                                        return `${titles[index]}: ${chalk.bold(current_stats[stat_name].toFixed(sig_fig))}`
                                    })
                                    .join(chalk.blue(` | `))
                            }

                            console.log(generateStatString(current_stats) + `\n`)
                            
                        }
                        newSolvePrompt()
                        //reset
                        timer_running = false
                        startTime = null
                        space_been_pressed = false
                    }
                }
                return
            } 
            process.stdout.write('\x1b[2K\r');
        });
    }
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
function stylizeScramble(scramble: string,r:number = 133,g:number = 18,b:number = 0): string {
    function rgb_to_hsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255;
        g /= 255;
        b /= 255;
      
        const max = Math.max(r, g, b),
              min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
      
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
      
          h *= 60;
        }
      
        return [Math.round(h), +(s * 100).toFixed(1), +(l * 100).toFixed(1)];
      }
      
    const generate_hsl_palette = (h:number,s:number,l:number)=>{
        //generates 5 colour pallete
        interface palette {
            complementary:[number,number,number],
            third_hue:[number,number,number],
            fourth_hue:[number,number,number],
            tint:[number,number,number]
        }
        const tetratic:palette = {
            complementary: [(h+180) %360,s,l],
            third_hue:[(h-90)%360,s,l],
            fourth_hue:[(h+270)%360,s,l],
            tint:[h,s*0.8,Math.min(l*1.2,100)]
        }

        const analogous:palette = {
            complementary: [(h+30) %360,s,l],
            third_hue:[(h-30)%360,s,l],
            fourth_hue:[(h+60)%360,s,l],
            tint:[(h-60)%360,s,l]
        }
        return tetratic
    }
    function hsl_to_rgb(h: number, s: number, l: number): [number, number, number] {
        s /= 100;
        l /= 100;
      
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
      
        let r = 0, g = 0, b = 0;
      
        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
      
        return [
          Math.round((r + m) * 255),
          Math.round((g + m) * 255),
          Math.round((b + m) * 255)
        ];
      }
    const [h,s,l] = rgb_to_hsl(r,g,b)
    const {complementary,fourth_hue,tint} = generate_hsl_palette(h,s,l)
    
    const colorMap: Record<string, (s: string) => string> = {
        'F': chalk.rgb(r,g,b).underline,
        'R': chalk.rgb(...hsl_to_rgb(...complementary)),
        'L': chalk.rgb(...hsl_to_rgb(...complementary)),
        'U': chalk.rgb(...hsl_to_rgb(...fourth_hue)),
        'D': chalk.rgb(...hsl_to_rgb(...fourth_hue)),
        "'": chalk.whiteBright,
        " ":chalk.whiteBright,
        '2': chalk.rgb(...hsl_to_rgb(...tint)),
    };

    const res = scramble
        .trim()
        .split('')
        .map(char => {
            const stylize = colorMap[char] || chalk.rgb(r,g,b);
            return stylize(char)
        })

    return res
        .join('')
}