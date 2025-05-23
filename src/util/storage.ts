import fs from 'fs';
import path from 'path';
import { parse } from 'path/posix';
import { fileURLToPath } from 'url';

import {sessionLog, file_data,global_statistics, session_statistics, SolveInstance} from "./interfaces"

const DATA_FILE = path.join(__dirname, './data.json');
const STAT_FILE = path.join(__dirname,'./stats.json')

export function loadStats():global_statistics{
    if(!fs.existsSync(STAT_FILE)){
        return {
            session_data: new Map(),
            pb_time: null,
            pb_Ao5: null,
            pb_Ao12:null
        }
    }else{
        const parsed:global_statistics = JSON.parse(fs.readFileSync(STAT_FILE, 'utf-8'))
        const restored_data = new Map<string,session_statistics>(parsed.session_data)
        return {
            session_data:restored_data,
            pb_Ao12:parsed.pb_Ao12,
            pb_Ao5:parsed.pb_Ao5,
            pb_time:parsed.pb_time
        }
    }
}
export function saveStats(data:global_statistics):void {
    fs.writeFileSync(STAT_FILE, JSON.stringify( {
        session_data:[...data.session_data],
        pb_Ao12:data.pb_Ao12,
        pb_Ao5:data.pb_Ao5,
        pb_time:data.pb_time
    } , null, 2))
}
export function newSessionLog(session_date:Date,event:string|null = null):sessionLog{
    return {
        entries: [],
        date: session_date.toISOString(),
        date_formatted:`${session_date.getFullYear()}-${(session_date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${session_date.getDate().toString().padStart(2, "0")} ${session_date
            .getHours()
            .toString()
            .padStart(2, "0")}:${session_date.getMinutes().toString().padStart(2, "0")}:${session_date
            .getSeconds()
            .toString()
            .padStart(2, "0")}`,
        event: event,
    }
}

export function loadData(): file_data {
  if (!fs.existsSync(DATA_FILE)) {
    let date_now:Date = new Date(Date.now())
    const date_ISO:string = date_now.toISOString()

    let val:sessionLog = newSessionLog(date_now);

    var Storage = new Map<string,sessionLog>([
        [date_ISO,val]
    ])

    return {
        data: Storage,
        last_accessed_log: date_ISO
    }
  }
  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  const restored_data = new Map<string,sessionLog>(parsed.data)
  return {
      data:restored_data,
      last_accessed_log:parsed.last_accessed_log
  }
}

export function saveData(data: file_data): void {
    const session_array:[string,sessionLog][] = [...data.data]
    
    fs.writeFileSync(DATA_FILE, JSON.stringify( {
        data:session_array,
        last_accessed_log:data.last_accessed_log
    } , null, 2));
}

export function retrieveAverageOver(average_num:number, date:Date|null = null):number|null {
    if(!fs.existsSync(DATA_FILE)){
        return null
    }else{

        const file_data = loadData()
        const session_date:string = date.toISOString() ?? file_data.last_accessed_log
        if(file_data.data.size < average_num){
            return null
        }else{
            return file_data.data.get(session_date)
                .entries.slice(-average_num)
                .map((solve_instance)=>{
                    return solve_instance.time
                })
                .reduce((acc,curr)=>{
                    return acc += curr
                },0)/average_num            
        }

    }
}

export function Ao5(session:sessionLog ):number{
    return averageOf(5,session,remove_extremes)
}

export function Ao12(session:sessionLog):number{
    const filter = (arr)=>{
        return remove_extremes(remove_extremes(arr))
    }
    return averageOf(12,session,filter)
}

export function averageOf(average_num:number, session:sessionLog,filter_process:any):number|null {
    if(!fs.existsSync(DATA_FILE)){
        return null
    }else{
        if(session.entries.length <=average_num){
            return null
        }else{
            let retrieved_times:number[] = session
                .entries
                .slice(-average_num)
                .map((solve_instance)=>{
                    return solve_instance.time
                })

            retrieved_times = filter_process(retrieved_times)

            return retrieved_times
                .reduce((acc,curr)=>{
                    return acc += curr
                },0)/average_num            
        }

    }
}
export function remove_extremes(arr: number[]): number[]{
    const extremes_to_remove = [Math.max(...arr),Math.min(...arr)]
    return arr.filter((val)=>(extremes_to_remove.indexOf(val) === -1))
}