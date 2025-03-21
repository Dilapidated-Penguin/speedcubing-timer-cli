const session_date:Date = new Date(process.argv[0])

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

let info_table = null

function updateInfo():void {
    let current_session_data:sessionLog = stored_data.data.get(session_date)
    let current_session_stats:session_statistics = global_stats.session_data.get(session_date)

    //display
    console.clear()
    console.log(`session: ${chalk.bgBlueBright(session_date)}`)
    if(current_session_data.entries !== undefined){
        info_table = current_session_data.entries.map((instance,index)=>{
            return {
                n: index,
                time: instance.time,
                label: instance.label,
            }
        })
        createTable(info_table,['n','time','label'])
    }

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