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
//const {Command} = require("commander")
//const figlet = require("figlet")
//const chalk = require("chalk")
const figlet_1 = __importDefault(require("figlet"));
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const events_json_1 = require("./events.json");
const prompts_1 = require("@inquirer/prompts");
const settingsUtil = __importStar(require("./util/settings"));
var Scrambow = require('scrambow').Scrambow;
const program = new commander_1.Command();
console.log(figlet_1.default.textSync("cli timer"));
program
    .version("1.0.0")
    .description("fast and lightweight CLI timer for speedcubing. Track your solves, get random scrambles, and analyze your times")
    .option("-s, --settings", "Displays the current global settings for the cli timer");
program
    .command('startsession')
    .argument('[event]', 'the event you wish to practice', '333')
    .option('-f, --focusMode', '')
    .description('Begin a session of practicing this specific event')
    .action((event, options) => {
    console.log(event);
    if (event !== undefined) {
        const normalized_event = event
            .toLowerCase()
            .trim();
        if (validEvent(normalized_event)) {
            startSession(normalized_event, options);
        }
        else {
            console.log(chalk_1.default.red(`${event} is not a valid/supported event`));
        }
    }
    else {
        (0, prompts_1.select)({
            message: 'Select an event',
            choices: events_json_1.event_choices
        })
            .then((event_choice) => {
            startSession(event_choice, options);
        }).catch((error) => {
            console.log(chalk_1.default.bgRed(`An error occurred`));
        });
    }
    //cubeScramble = cube(Number(event), current_settings.scramble_length).toString()
});
program
    .command("settings")
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
            console.log(chalk_1.default.red('Invalid argument:' + chalk_1.default.white('The argument is not a setting to change')));
        }
    }
});
program.parse(process.argv);
const options = program.opts();
if (options.settings) {
    console.table(settingsUtil.loadSettings());
    console.log(chalk_1.default.italic('Use')
        + chalk_1.default.green(' cubetimer ')
        + chalk_1.default.cyan('settings ')
        + chalk_1.default.italic('to change any of the above'));
}
function updateSetting(current_settings, property) {
    const prompt = (typeof current_settings[property] === 'number') ? prompts_1.number : prompts_1.input;
    prompt({
        message: `Enter new value for ${property}`,
        default: `${current_settings[property]}`
    }).then((new_value) => {
        current_settings[property] = new_value;
        settingsUtil.saveSettings(current_settings);
        console.log(chalk_1.default.green('settings updated!'));
        console.table(current_settings);
    });
}
function validEvent(event_to_check) {
    return (events_json_1.events_list.indexOf(event_to_check) !== -1);
}
function startSession(event, options) {
    console.clear();
    const session_date = Date.now();
    console.log(figlet_1.default.textSync('session:'));
    console.log(figlet_1.default.textSync(`${session_date}`));
    const current_settings = settingsUtil.loadSettings();
    //scramble generator
    var scramble_generator = new Scrambow();
    let scramble = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string;
    console.log(stylizeScramble(scramble));
}
//acc += scramble_styling[index]
function stylizeScramble(scramble) {
    return scramble
        .trim()
        .split('')
        .reduce((acc, curr) => {
        switch (curr) {
            case 'r':
                return acc += chalk_1.default.redBright(curr);
            case 'l':
                return acc += chalk_1.default.blueBright(curr);
            case 'u':
                return acc += chalk_1.default.cyanBright(curr);
            case 'd':
                return acc += chalk_1.default.greenBright(curr);
            case `'`:
                return acc += chalk_1.default.whiteBright(curr);
            default:
                return acc += chalk_1.default.magenta(curr);
        }
    }, '');
}
//# sourceMappingURL=index.js.map