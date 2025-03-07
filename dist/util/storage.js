"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStats = loadStats;
exports.saveStats = saveStats;
exports.newSessionLog = newSessionLog;
exports.loadData = loadData;
exports.saveData = saveData;
exports.retrieveAverageOver = retrieveAverageOver;
exports.Ao5 = Ao5;
exports.Ao12 = Ao12;
exports.averageOf = averageOf;
exports.remove_extremes = remove_extremes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.join(__dirname, './data.json');
const STAT_FILE = path_1.default.join(__dirname, './stats.json');
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
        return JSON.parse(fs_1.default.readFileSync(STAT_FILE, 'utf-8'));
    }
}
function saveStats(data) {
    fs_1.default.writeFileSync(STAT_FILE, JSON.stringify(data, null, 2));
}
function newSessionLog(session_date, event = null) {
    return {
        entries: [],
        date: session_date,
        date_formatted: `${session_date.getFullYear()}-${(session_date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${session_date.getDate().toString().padStart(2, "0")} ${session_date
            .getHours()
            .toString()
            .padStart(2, "0")}:${session_date.getMinutes().toString().padStart(2, "0")}:${session_date
            .getSeconds()
            .toString()
            .padStart(2, "0")}`,
        session_average: null,
        event: event,
        worst_time: null,
        best_time: null
    };
}
function loadData() {
    if (!fs_1.default.existsSync(DATA_FILE)) {
        let date_now = new Date(Date.now());
        let val = newSessionLog(date_now);
        var Storage = new Map([
            [date_now, val]
        ]);
        return {
            data: Storage,
            last_accessed_log: date_now
        };
    }
    const parsed = JSON.parse(fs_1.default.readFileSync(DATA_FILE, 'utf-8'));
    const restored_data = new Map(parsed.data);
    return {
        data: restored_data,
        last_accessed_log: parsed.last_accessed_log
    };
}
function saveData(data) {
    const session_array = [...data.data];
    fs_1.default.writeFileSync(DATA_FILE, JSON.stringify({
        data: session_array,
        last_accessed_log: data.last_accessed_log
    }, null, 2));
}
function retrieveAverageOver(average_num, date = null) {
    if (!fs_1.default.existsSync(DATA_FILE)) {
        return null;
    }
    else {
        const file_data = loadData();
        const session_date = date !== null && date !== void 0 ? date : file_data.last_accessed_log;
        if (file_data.data.size < average_num) {
            return null;
        }
        else {
            return file_data.data.get(session_date)
                .entries.slice(-average_num)
                .map((solve_instance) => {
                return solve_instance.time;
            })
                .reduce((acc, curr) => {
                return acc += curr;
            }, 0) / average_num;
        }
    }
}
function Ao5(session) {
    return averageOf(5, session, remove_extremes);
}
function Ao12(session) {
    const filter = (arr) => {
        return remove_extremes(remove_extremes(arr));
    };
    return averageOf(12, session, filter);
}
function averageOf(average_num, session, filter_process) {
    if (!fs_1.default.existsSync(DATA_FILE)) {
        return null;
    }
    else {
        if (session.entries.length <= average_num) {
            return null;
        }
        else {
            let retrieved_times = session
                .entries
                .slice(-average_num)
                .map((solve_instance) => {
                return solve_instance.time;
            });
            retrieved_times = filter_process(retrieved_times);
            return retrieved_times
                .reduce((acc, curr) => {
                return acc += curr;
            }, 0) / average_num;
        }
    }
}
function remove_extremes(arr) {
    const extremes_to_remove = [Math.max(...arr), Math.min(...arr)];
    return arr.filter((val) => (extremes_to_remove.indexOf(val) === -1));
}
//# sourceMappingURL=storage.js.map