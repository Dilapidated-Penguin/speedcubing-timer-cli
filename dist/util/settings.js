"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSettings = saveSettings;
exports.loadSettings = loadSettings;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SETTINGS_FILE = path_1.default.join(__dirname, "../settings.json");
function saveSettings(data) {
    fs_1.default.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}
function loadSettings() {
    if (!fs_1.default.existsSync(SETTINGS_FILE)) {
        return {
            scramble_length: 12,
            inspection_sec: 15,
            default_bpm: "60",
            default_metronome: 'tick.wav',
            sig_fig: 3,
            scramble_colour_scheme: 'analogous'
        };
    }
    else {
        const output = JSON.parse(fs_1.default.readFileSync(SETTINGS_FILE, 'utf-8'));
        return output;
    }
}
//# sourceMappingURL=settings.js.map