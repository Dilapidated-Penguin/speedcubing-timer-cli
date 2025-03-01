const {Command} = require("commander")
const figlet = require("figlet")
const chalk = require("chalk")
import * as Scrambler from 'sr-scrambler'

//import { cube } from 'sr-scrambler'
const EVENTS = ['pyraminx','square1','megaminx','skewb']

import { select,number,Separator, input} from '@inquirer/prompts';
import {settings, sessionLog, file_data,global_statistics,event_types} from "./util/interfaces"

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
    .argument('[event]', 'the event you wish to practice','3')
    .option('-f, --focusMode','')
    .description('Begin a session of practicing this specific event')
    .action((event:string,options:any)=>{
        if(event !== undefined){
            const normalized_event = event
                .toLowerCase()
                .trim()
            if(validEvent(normalized_event)){
                startSession(normalized_event,options)
            }else{
                console.log(chalk.red(
                    `${event} is not a valid event`
                ));
            }
        }else{
            let non_cube_events = EVENTS.map((event)=>{
                return {
                    name: event,
                    value: event,
                }
            })
            let cube_choices =  [...Array(8)].map((_, i) => {
                return {
                    name: `${i + 1}x${i + 1}`,
                    value: `${i + 1}`
                }
            })
            
            select({
                message:'Select an event',
                choices:[...non_cube_events,new Separator('cube'),...cube_choices]
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
    .Commmand("settings")
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

const options = program.opts();

if(options.settings){
    
    console.table(settingsUtil.loadSettings())
    console.log(chalk.italic('Use')
    + chalk.green('cubetimer ')
    + chalk.cyan('settings')
    + chalk.italic('to change any of the above'))
}

function updateSetting(current_settings:settings,property:string):void{
    const prompt = (typeof current_settings[property] === 'number') ? number : input
    prompt({
        message: `Enter new value for ${current_settings[property]}`
    }).then((new_value:number|string)=>{
        current_settings[property] = new_value
        settingsUtil.saveSettings(current_settings)

        console.log(chalk.green('settings updated!'))
        console.table(settingsUtil)
    })
}

function validEvent(event_to_check:string):boolean{
    return (EVENTS.indexOf(event_to_check) !== -1) || !isNaN(Number(event_to_check))
}
function startSession(event: string,options:any):void{
    console.clear()
    const session_date = Date.now()
    console.log(figlet.textSync('session:'))
    console.log(figlet.textSync(`${session_date}`))

    const current_settings:settings = settingsUtil.loadSettings()
    //scramble generator
    let scramble: string
    if(!isNaN(Number(event))){
        scramble = Scrambler.cube(Number(event),current_settings.scramble_length).toString()
    }else{
        if(event !== 'megaminx'){
            scramble = Scrambler[event](current_settings.scramble_length).toString()
        }else{
            scramble = Scrambler[event]().toString()
        }
        
    }
    /*
    const scramble_styling = ScrambleStyle(scramble)
    const output_string = scramble
        .trim()
        .split('')
        .reduce((acc,curr,index)=>{
            return acc += scramble_styling[index](acc)
        },'')
    console.log(output_string)
    */
   console.log(chalk.magenta(scramble))
   console.log(`\n`)
   console.log(chalk.inverse('Hold the' +chalk.bold('spacebar')+ 'to start the timer!'))

}

function ScrambleStyle(scramble:String):((character:string)=>string)[]{
    return scramble
        .trim()
        .split('')
        .map((char:string)=>{
            switch(char){
                case 'r':
                    return chalk.redBright
                case 'l':
                    return chalk.blueBright
                case 'u':
                    return chalk.cyanBright
                case 'd':
                    return chalk.greenBright
                case `'`:
                    return chalk.whiteBright
                default:
                    return chalk.magenta
            }
        })
}