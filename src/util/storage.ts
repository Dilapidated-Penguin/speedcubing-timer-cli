import fs from 'fs';
import path from 'path';

import {sessionLog, file_data,global_statistics} from "./interfaces"

const DATA_FILE = path.join(__dirname, '../../data.json');
const STAT_FILE = path.join(__dirname,'../../stats.json')

export function loadStats():global_statistics{
    if(!fs.existsSync(STAT_FILE)){
        return {
            session_data: [],
            pb_time: null,
            pb_Ao5: null,
            pb_Ao12:null
        }
    }else{
        return JSON.parse(fs.readFileSync(STAT_FILE, 'utf-8'));
    }
}
export function saveStats(data:global_statistics):void {
    fs.writeFileSync(STAT_FILE, JSON.stringify( data , null, 2))
}
export function newSessionLog(session_date:Date):sessionLog{
    return {
        entries: [],
        date: session_date,
        date_formatted:`${session_date.getFullYear()}-${(session_date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${session_date.getDate().toString().padStart(2, "0")} ${session_date
            .getHours()
            .toString()
            .padStart(2, "0")}:${session_date.getMinutes().toString().padStart(2, "0")}:${session_date
            .getSeconds()
            .toString()
            .padStart(2, "0")}`
    }
}

export function loadData(): file_data {
  if (!fs.existsSync(DATA_FILE)) {
    let date_now:Date = new Date(Date.now())
    let val:sessionLog = newSessionLog(date_now);

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

export function saveData(data: file_data): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify( data , null, 2));
}

export function retrieveAverageOver(average_num:number, date:Date|null = null):number {
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

export function Ao5(date:Date = null):number{
    return averageOf(5,date,remove_extremes)
}

export function Ao12(date:Date|null = null):number{
    const filter = (arr)=>{
        return remove_extremes(remove_extremes(arr))
    }
    return averageOf(12,date,filter)
}

export function averageOf(average_num:number, date:Date|null = null,filter_process:any):number {
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
export function remove_extremes(arr: number[]): number[]{
    const extremes_to_remove = [Math.max(...arr),Math.min(...arr)]
    return arr.filter((val)=>(extremes_to_remove.indexOf(val) === -1))
}