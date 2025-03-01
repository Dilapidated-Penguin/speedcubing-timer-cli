"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.join(__dirname, '../../data.json');
const STAT_FILE = path_1.default.join(__dirname, '../../stats.json');
function loadStats() {
    if (!fs_1.default.existsSync(STAT_FILE)) {
        return {
            session_data: [],
            pb_time: null,
            pb_Ao5: null,
            pb_Ao12: null
        };
    }
    else {
        JSON.parse(fs_1.default.readFileSync(STAT_FILE, 'utf-8'));
    }
}
function saveStats(data) {
    fs_1.default.writeFileSync(STAT_FILE, JSON.stringify(data, null, 2));
}
function loadData() {
    if (!fs_1.default.existsSync(DATA_FILE)) {
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
    return JSON.parse(fs_1.default.readFileSync(DATA_FILE, 'utf-8'));
}
function saveData(data) {
    fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function retrieveAverageOver(average_num, date = null) {
    if (!fs_1.default.existsSync(DATA_FILE)) {
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
function Ao5(date = null) {
    return averageOf(5, date, remove_extremes);
}
function Ao12(date = null) {
    const filter = (arr) => {
        return remove_extremes(remove_extremes(arr));
    };
    return averageOf(12, date, filter);
}
function averageOf(average_num, date = null, filter_process) {
    if (!fs_1.default.existsSync(DATA_FILE)) {
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
function remove_extremes(arr) {
    const extremes_to_remove = [Math.max(...arr), Math.min(...arr)];
    return arr.filter((val) => (extremes_to_remove.indexOf(val) === -1));
}
module.exports = {
    saveData,
    saveStats,
    loadStats,
    loadData,
    Ao5,
    Ao12,
};
//# sourceMappingURL=storage.js.map