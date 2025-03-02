import fs from 'fs';
import path from 'path';
const DATA_FILE = path.join(__dirname, '../../data.json');
const STAT_FILE = path.join(__dirname, '../../stats.json');
export function loadStats() {
    if (!fs.existsSync(STAT_FILE)) {
        return {
            session_data: [],
            pb_time: null,
            pb_Ao5: null,
            pb_Ao12: null
        };
    }
    else {
        return JSON.parse(fs.readFileSync(STAT_FILE, 'utf-8'));
    }
}
export function saveStats(data) {
    fs.writeFileSync(STAT_FILE, JSON.stringify(data, null, 2));
}
export function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        let date_now = new Date(Date.now());
        let val = {
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
        var Storage = new Map([
            [date_now, val]
        ]);
        return {
            data: Storage,
            last_accessed_log: date_now
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
export function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
export function retrieveAverageOver(average_num, date = null) {
    if (!fs.existsSync(DATA_FILE)) {
        return null;
    }
    else {
        const file_data = loadData();
        const session_date = date !== null && date !== void 0 ? date : file_data.last_accessed_log;
        return file_data.data.get(session_date)
            .entries.slice(-average_num)
            .map((solve_instance) => {
            return solve_instance.time.getTime();
        })
            .reduce((acc, curr) => {
            return acc += curr;
        }, 0) / average_num;
    }
}
export function Ao5(date = null) {
    return averageOf(5, date, remove_extremes);
}
export function Ao12(date = null) {
    const filter = (arr) => {
        return remove_extremes(remove_extremes(arr));
    };
    return averageOf(12, date, filter);
}
export function averageOf(average_num, date = null, filter_process) {
    if (!fs.existsSync(DATA_FILE)) {
        return null;
    }
    else {
        const file_data = loadData();
        const session_date = date !== null && date !== void 0 ? date : file_data.last_accessed_log;
        let retrieved_times = file_data.data.get(session_date)
            .entries.slice(-average_num)
            .map((solve_instance) => {
            return solve_instance.time.getTime();
        });
        retrieved_times = filter_process(retrieved_times);
        return retrieved_times.reduce((acc, curr) => {
            return acc += curr;
        }, 0) / average_num;
    }
}
export function remove_extremes(arr) {
    const extremes_to_remove = [Math.max(...arr), Math.min(...arr)];
    return arr.filter((val) => (extremes_to_remove.indexOf(val) === -1));
}
//# sourceMappingURL=storage.js.map