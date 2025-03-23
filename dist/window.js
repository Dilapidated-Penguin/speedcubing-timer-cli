"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const session_date = process.argv[2];
const storage = __importStar(require("./util/storage"));
const chalk_1 = __importDefault(require("chalk"));
const nice_table_1 = require("nice-table");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.join(__dirname, "./util/data.json");
const STATS_FILE = path_1.default.join(__dirname, "./util/stats.json");
let stored_data = storage.loadData();
let global_stats = storage.loadStats();
let ao5_list = [];
let ao12_list = [];
function updateInfo() {
    let current_session_data = stored_data.data.get(session_date);
    console.log(session_date);
    console.log(current_session_data);
    ao5_list.push(storage.Ao5(current_session_data));
    ao12_list.push(storage.Ao12(current_session_data));
    let current_session_stats = global_stats.session_data.get(session_date);
    //display
    console.clear();
    console.log(`session: ${chalk_1.default.bgBlueBright(session_date)}`);
    let info_table = current_session_data.entries.map((instance, index) => {
        var _a, _b;
        const label = (instance.label === "DNF") ? chalk_1.default.red(instance.label) : chalk_1.default.yellow(instance.label);
        const time = (instance.time === current_session_stats.fastest_solve) ? chalk_1.default.blue(instance.time) : instance.time;
        return {
            n: index + 1,
            time: time,
            label: label !== null && label !== void 0 ? label : chalk_1.default.green('OK'),
            ao5: (_a = ao5_list[index]) !== null && _a !== void 0 ? _a : '-',
            ao12: (_b = ao12_list[index]) !== null && _b !== void 0 ? _b : '-'
        };
    });
    console.log(`\n`);
    console.log((0, nice_table_1.createTable)(info_table, ['n', 'time', 'label', 'ao5', 'ao12']));
    console.log(Object.keys(current_session_stats).map((key_name) => {
        return `${key_name}: ${current_session_stats[key_name].toFixed(3)} ${chalk_1.default.green('s')}`;
    })
        .join(chalk_1.default.blue('\n')));
}
fs_1.default.watch(DATA_FILE, (eventType, filename) => {
    if (eventType === 'change') {
        stored_data = storage.loadData();
        updateInfo();
    }
});
fs_1.default.watch(STATS_FILE, (eventType, filename) => {
    if (eventType === 'change') {
        global_stats = storage.loadStats();
        updateInfo();
    }
});
//# sourceMappingURL=window.js.map