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
Object.defineProperty(exports, "__esModule", { value: true });
const { Command } = require("commander");
const figlet = require("figlet");
const chalk = require("chalk");
const Scrambler = __importStar(require("sr-scrambler"));
const EVENTS = ['pyraminx', 'square1', 'megaminx', 'skewb'];
//const {inquirer,select} = require("@inquirer/prompts")
const prompts_1 = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const storage = require("./util/storage");
const settingsUtil = require("./util/settings");
const program = new Command();
console.log(figlet.textSync("cli timer"));
program
    .version("1.0.0")
    .description("fast and lightweight CLI timer for speedcubing. Track your solves, get random scrambles, and analyze your times")
    .option("-s, --settings", "Displays the current global settings for the cli timer")
    .parse(process.argv);
program
    .Command('startsession')
    .argument('[event]', 'the event you wish to practice', '3')
    .option('-f, --focusMode', '')
    .description('Begin a session of practicing this specific event')
    .action((event, options) => {
    console.clear();
    const session = Date.now();
    const current_settings = settingsUtil.loadSettings();
    let cubeScramble;
    if (event !== undefined) {
        const normalized_event = event
            .toLowerCase()
            .trim();
        if (validEvent(normalized_event)) {
            startSession(normalized_event, options);
        }
        else {
            console.log(chalk.red(`${event} is not a valid event`));
        }
    }
    else {
        let non_cube_events = EVENTS.map((event) => {
            return {
                name: event,
                value: event,
            };
        });
        let cube_choices = [...Array(8)].map((_, i) => {
            return {
                name: `${i + 1}x${i + 1}`,
                value: `${i + 1}`
            };
        });
        (0, prompts_1.select)({
            message: 'Select an event',
            choices: [...non_cube_events, new prompts_1.Separator('cube'), ...cube_choices]
        })
            .then((event_choice) => {
            startSession(event_choice, options);
        }).catch((error) => {
            console.log(chalk.bgRed(`An error occurred`));
        });
    }
    cubeScramble = Scrambler.cube(Number(event), current_settings.scramble_length).toString();
    console.log(figlet.textSync('session:'));
    console.log(figlet.textSync(`${session}`));
    //console.log(figlet.textSync)
});
program
    .Commmand("settings")
    .argument("[property]", "configure the cli to your liking")
    .action((setting_to_change) => {
    let current_settings = settingsUtil.loadSettings();
    const settings_list = Object.keys(current_settings);
    if (setting_to_change === undefined) {
        (0, prompts_1.select)({
            message: "Select the setting you'd like to alter",
            choices: settings_list
        }).then((answer) => {
            updateSetting(current_settings, answer);
        });
    }
    else {
        if (settings_list.indexOf(setting_to_change) !== -1) {
            updateSetting(current_settings, setting_to_change);
        }
        else {
            console.log(chalk.red('Invalid argument:' + chalk.white('The argument is not a setting to change')));
        }
    }
});
const options = program.opts();
if (options.settings) {
    console.table(settingsUtil.loadSettings());
    console.log(chalk.italic('Use')
        + chalk.green('cubetimer ')
        + chalk.cyan('settings')
        + chalk.italic('to change any of the above'));
}
function updateSetting(current_settings, property) {
    const prompt = (typeof current_settings[property] === 'number') ? prompts_1.number : prompts_1.input;
    prompt({
        message: `Enter new value for ${current_settings[property]}`
    }).then((new_value) => {
        current_settings[property] = new_value;
        settingsUtil.saveSettings(current_settings);
        console.log(chalk.green('settings updated!'));
        console.table(settingsUtil);
    });
}
function validEvent(event_to_check) {
    return (EVENTS.indexOf(event_to_check) !== -1) || !isNaN(Number(event_to_check));
}
function startSession(event, options) {
}
//# sourceMappingURL=index.js.map