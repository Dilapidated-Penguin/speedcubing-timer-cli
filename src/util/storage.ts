import { makeTheme } from '@inquirer/core';
import { time } from 'console';

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(__dirname, '../../data.json');
const STAT_FILE = path.join(__dirname,'../../stats.json')

interface SolveInstance {
    time: Date;
    scramble: string;
    format: string;
}
interface sessionLog {
    entries: SolveInstance[];
    date: Date;
    date_formatted : string;
}
interface file_data {
    data: Map<Date,sessionLog>;
    last_accessed_log: Date;
}
//######################
interface session_statistics {
    solve_mean:number;
    standard_deviation: number;
    fastest_solve: number;
    slowest_solve: number;
}

interface global_statistics {
    session_data:session_statistics[];
    pb_time: number | null;
    pb_Ao5:number | null;
    pb_Ao12:number | null;
}

function loadStats():global_statistics{
    if(!fs.existsSync(STAT_FILE)){
        return {
            session_data: [],
            pb_time: null,
            pb_Ao5: null,
            pb_Ao12:null
        }
    }else{
        JSON.parse(fs.readFileSync(STAT_FILE, 'utf-8'));
    }
}
function saveStats(data:global_statistics):void {
    fs.writeFileSync(STAT_FILE, JSON.stringify( data , null, 2));
}
function loadData(): file_data {
  if (!fs.existsSync(DATA_FILE)) {
    let date_now:Date = new Date(Date.now())
    let val:sessionLog = { 
        entries: [],
        date: date_now,
        date_formatted: `${date_now.getFullYear()}-${(date_now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date_now.getDate().toString().padStart(2, "0")} ${date_now
            .getHours()
            .toString()
            .padStart(2, "0")}:${date_now.getMinutes().toString().padStart(2, "0")}:${date_now
            .getSeconds()
            .toString()
            .padStart(2, "0")}`
    };

    var Storage = new Map<Date,sessionLog>([
        [date_now,val]
    ])

    return {
        data: Storage,
        last_accessed_log: date_now
    }
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data: file_data): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify( data , null, 2));
}

function retrieveAverageOver(average_num:number, date:Date|null = null):number {
    if(!fs.existsSync(DATA_FILE)){
        return null
    }else{
        const file_data = loadData()
        const session_date = date ?? file_data.last_accessed_log

        return file_data.data.get(session_date)
            .entries.slice(-average_num)
            .map((solve_instance)=>{
                return solve_instance.time.getTime()
            })
            .reduce((acc,curr)=>{
                return acc += curr
            },0)/average_num
    }
}

function Ao5(date:Date = null):number{
    return averageOf(5,date,remove_extremes)
}

function Ao12(date:Date|null = null):number{
    const filter = (arr)=>{
        return remove_extremes(remove_extremes(arr))
    }
    return averageOf(12,date,filter)
}

function averageOf(average_num:number, date:Date|null = null,filter_process:any):number {
    if(!fs.existsSync(DATA_FILE)){
        return null
    }else{
        const file_data = loadData()
        const session_date = date ?? file_data.last_accessed_log
        let retrieved_times = file_data.data.get(session_date) 
            .entries.slice(-average_num)
            .map((solve_instance)=>{
                return solve_instance.time.getTime()
            })

        retrieved_times = filter_process(retrieved_times)

        return retrieved_times.reduce((acc,curr)=>{
            return acc += curr
        },0)/average_num
    }
}
function remove_extremes(arr: number[]): number[]{
    const extremes_to_remove = [Math.max(...arr),Math.min(...arr)]
    return arr.filter((val)=>(extremes_to_remove.indexOf(val) === -1))
}

module.exports = {
    saveData,
    saveStats,
    loadStats,
    loadData,
    Ao5,
    Ao12,
}