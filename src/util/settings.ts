import fs from 'fs';
import path from 'path';
import {settings} from "./interfaces"

const SETTINGS_FILE = path.join(__dirname,"../settings.json")

export function saveSettings(data:settings):void {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify( data , null, 2));
}
export function loadSettings():settings {
    if(!fs.existsSync(SETTINGS_FILE)){
        return {
            scramble_length: 12,
            inspection_sec: 15,
            default_bpm: "60",
            default_metronome:'tick.wav',
            sig_fig:3
        }
    }else{
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
}