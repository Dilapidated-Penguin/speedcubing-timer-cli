const session_date:string = process.argv[2]

import * as storage from "./util/storage"
import {settings, sessionLog, file_data,global_statistics,event_types, session_statistics, SolveInstance} from "./util/interfaces"

import chalk, { ChalkInstance } from "chalk";
import { createTable } from 'nice-table';

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(__dirname,"./util/data.json")
const STATS_FILE = path.join(__dirname,"./util/stats.json")

let stored_data:file_data = storage.loadData()

let global_stats:global_statistics = storage.loadStats()

let ao5_list:number[] = []
let ao12_list:number[] = []

function updateInfo():void {
    let current_session_data:sessionLog = stored_data.data.get(session_date)

    console.log(session_date)
    console.log(current_session_data)

    ao5_list.push(storage.Ao5(current_session_data))
    ao12_list.push(storage.Ao12(current_session_data))

    let current_session_stats:session_statistics = global_stats.session_data.get(session_date)

    //display
    console.clear()
    console.log(`session: ${chalk.bgBlueBright(session_date)}`)

    let info_table = current_session_data.entries.map((instance,index)=>{
        return {
            n: index+1,
            time: instance.time,
            label: instance.label ?? chalk.green('OK'),
            ao5: ao5_list[index] ?? '-',
            ao12:ao12_list[index] ?? '-'
        }
    })
    console.log(`\n`)
    console.log(createTable(info_table,['n','time','label','ao5','ao12']))

    console.log(Object.keys(current_session_stats).map((key_name:string)=>{
        return `${key_name}: ${current_session_stats[key_name].toFixed(3)} ${chalk.green('s')}`
    })
    .join(chalk.blue('\n')))
}

fs.watch(DATA_FILE, (eventType, filename) => {
    if (eventType === 'change') {
        stored_data = storage.loadData()
        updateInfo()
    }
});
fs.watch(STATS_FILE, (eventType, filename) => {
    if (eventType === 'change') {
        global_stats = storage.loadStats()
        updateInfo()
    }
});