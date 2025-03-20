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
const session_date = new Date(process.argv[0]);
const storage = __importStar(require("./util/storage"));
const chalk_1 = __importDefault(require("chalk"));
const nice_table_1 = require("nice-table");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.join(__dirname, "./util/data.json");
const STATS_FILE = path_1.default.join(__dirname, "./util/stats.json");
let stored_data = storage.loadData();
let global_stats = storage.loadStats();
let current_session_data = stored_data.data.get(session_date);
let a;
function updateInfo() {
    current_session_data = stored_data.data.get(session_date);
    console.clear();
    console.log(`session: ${chalk_1.default.bgBlueBright(session_date)}`);
    (0, nice_table_1.createTable)(current_session_data.entries.map((instance, index) => {
        return {
            time: instance.time,
            Label: instance.label
        };
    }), ['time', 'Label']);
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