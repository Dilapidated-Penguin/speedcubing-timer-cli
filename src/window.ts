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
let current_session_data:sessionLog = stored_data.data.get(session_date)

function updateInfo():void {
    current_session_data = stored_data.data.get(session_date)
    console.clear()

    console.log(`session: ${chalk.bgBlueBright(session_date)}`)
    
    createTable(current_session_data.entries.map((instance:SolveInstance,index:number)=>{
        return {
           time:instance.time,
           label:instance.label
        }
    }),['time','label'])

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