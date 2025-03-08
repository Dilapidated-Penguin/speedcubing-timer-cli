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
const figlet_1 = __importDefault(require("figlet"));
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const events_json_1 = require("./events.json");
const nice_table_1 = require("nice-table");
const prompts_1 = require("@inquirer/prompts");
const storage = __importStar(require("./util/storage"));
const settingsUtil = __importStar(require("./util/settings"));
var Scrambow = require('scrambow').Scrambow;
const program = new commander_1.Command();
var saved_data = storage.loadData();
//timer variables**********************************
//process.stdin.setRawMode(true);
let timer_running = false;
let startTime = null;
let space_been_pressed = false;
const node_global_key_listener_1 = require("@futpib/node-global-key-listener");
const listener = new node_global_key_listener_1.GlobalKeyboardListener();
//*************************************************
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
    const session = Date.now();
    const session_date = new Date(session);
    console.log(figlet_1.default.textSync('session:'));
    console.log(figlet_1.default.textSync(`${session}`));
    const current_settings = settingsUtil.loadSettings();
    //saved_data.data.set(new Date(session_date)
    saved_data.data.set(session_date, storage.newSessionLog(session_date, event));
    saved_data.last_accessed_log = session_date;
    storage.saveData(saved_data);
    newSolve(current_settings, event, session_date, options);
}
function newSolve(current_settings, event, session_date, option) {
    var scramble_generator = new Scrambow();
    process.stdin.resume();
    let scramble = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string;
    console.log(stylizeScramble(scramble));
    listener.addListener(function (e, down) {
        var _a, _b;
        if ((e.name === "D") && (e.state === "DOWN")) {
            const current_session = saved_data.data.get(session_date);
            if (current_session.entries.length >= 1) {
                current_session.entries.pop();
                console.log(chalk_1.default.blue(`Last solve deleted`));
                saved_data.data.set(session_date, current_session);
                storage.saveData(saved_data);
            }
            else {
                console.log(chalk_1.default.red(`There exist no entries in the current session to delete`));
            }
        }
        if ((e.name === "N") && (e.state === "DOWN")) {
            listener.kill();
            newSolve(current_settings, event, session_date, option);
        }
        if ((e.name === "E") && (e.state === "DOWN")) {
            const current_session = saved_data.data.get(session_date);
            console.log(`\n \n`);
            if (current_session.entries.length >= 1) {
                (0, prompts_1.select)({
                    message: `Select the label for the previous solve`,
                    choices: [
                        '+3',
                        'DNF',
                        'OK'
                    ]
                }).then((answer) => {
                    current_session.entries.at(-1).label = answer;
                    saved_data.data.set(session_date, current_session);
                    storage.saveData(saved_data);
                    console.log(chalk_1.default.green(`Last solve labelled ${answer}`));
                    console.log(chalk_1.default.bold.magentaBright(`Whenever ready use the spacebar to start a new solve`));
                }).catch((err) => {
                    console.log(chalk_1.default.red(`An error has occurred`));
                });
            }
            else {
                console.log(chalk_1.default.red(`There exist no entries in the current session to label`));
            }
            console.log(`\n \n`);
        }
        if ((e.name === "SPACE")) {
            if (!timer_running) {
                if (e.state === "DOWN") {
                    if (!space_been_pressed) {
                        space_been_pressed = true;
                        process.stdout.write(chalk_1.default.bgRed('...'));
                    }
                    else {
                        process.stdout.write("\b \b");
                        //potential patch for space
                    }
                }
                else {
                    if (space_been_pressed) {
                        space_been_pressed = false;
                        process.stdout.write('\x1b[2K'); // Clear the line
                        console.log(chalk_1.default.bgGreenBright('SOLVE') +
                            '\n \n');
                        startTimer();
                    }
                }
            }
            else {
                if (e.state === "DOWN") {
                    const elapsedTime = stopTimer();
                    const current_session = saved_data.data.get(session_date);
                    current_session.entries.push({
                        scramble: scramble,
                        time: elapsedTime,
                        label: null
                    });
                    const session_average = current_session
                        .entries
                        .reduce((acc, curr) => {
                        return acc += curr.time;
                    }, 0) / current_session.entries.length;
                    const best_time = current_session
                        .entries
                        .reduce((acc, curr) => {
                        if (acc < curr.time) {
                            return acc;
                        }
                        else {
                            return curr.time;
                        }
                    }, Infinity);
                    const worst_time = current_session
                        .entries
                        .reduce((acc, curr) => {
                        if (acc > curr.time) {
                            return acc;
                        }
                        else {
                            return curr.time;
                        }
                    }, -Infinity);
                    const variance = current_session
                        .entries
                        .reduce((acc, curr) => {
                        return acc += Math.pow((session_average - curr.time), 2);
                    }, 0) / current_session.entries.length;
                    const stats_data = storage.loadStats();
                    const current_stats = {
                        session_mean: session_average,
                        standard_deviation: Math.sqrt(variance),
                        variance: variance,
                        fastest_solve: best_time,
                        slowest_solve: worst_time
                    };
                    stats_data.session_data.set(session_date, current_stats);
                    storage.saveStats(stats_data);
                    saved_data.data.set(session_date, current_session);
                    storage.saveData(saved_data);
                    console.log(chalk_1.default.bold(`Time: `) + elapsedTime.toFixed(4) + chalk_1.default.green('s') +
                        `\n`);
                    console.log(chalk_1.default.bold(`Ao5: `) + chalk_1.default.magenta((_a = storage.Ao5(current_session)) !== null && _a !== void 0 ? _a : "--") + chalk_1.default.green(`s`));
                    console.log(chalk_1.default.bold(`Ao12: `) + chalk_1.default.magenta((_b = storage.Ao12(current_session)) !== null && _b !== void 0 ? _b : "--") + chalk_1.default.green(`s`) +
                        `\n \n`);
                    //check if Ao5/12 are the best 
                    if (!option.focusMode) {
                        //solves
                        console.table((0, nice_table_1.createTable)(current_session.entries.map((instance) => {
                            var _a;
                            return {
                                time: instance.time.toFixed(3),
                                label: (_a = instance.label) !== null && _a !== void 0 ? _a : 'OK'
                            };
                        }), ['time', 'label']));
                        //stats
                        const titles = ['average', 'std. dev.', 'variance', 'fastest', 'slowest'];
                        const stats_string = Object.keys(current_stats)
                            .map((stat_name, index) => {
                            return `${titles[index]}: ${chalk_1.default.bold(current_stats[stat_name].toFixed(3))}`;
                        })
                            .join(chalk_1.default.blue(` | `));
                        console.log(stats_string + `\n`);
                        console.log(`\n`);
                        console.log(chalk_1.default.dim(`To label/delete the last solve simply use (`) +
                            chalk_1.default.italic.yellow(`e`) + chalk_1.default.dim(`/`) + chalk_1.default.italic.yellow(`d`) +
                            chalk_1.default.dim(`) respectively`));
                        console.log(chalk_1.default.dim(`Exit session mode using`), chalk_1.default.green(`Ctrl+C`) +
                            `\n`);
                        console.log(chalk_1.default.bold.magentaBright(`Whenever ready use the spacebar to start a new solve using`) + chalk_1.default.italic.yellow(`n`) +
                            `\n \n`);
                    }
                    //reset
                    timer_running = false;
                    startTime = null;
                    space_been_pressed = false;
                }
            }
        }
    });
}
function stopTimer() {
    if (!startTime)
        return;
    timer_running = false;
    const endTime = process.hrtime(startTime);
    return endTime[0] + endTime[1] / 1e9;
}
function startTimer() {
    startTime = process.hrtime();
    timer_running = true;
}
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
            case '2':
                return acc += chalk_1.default.cyan(curr);
            case 'F':
                return acc += chalk_1.default.magenta.underline(curr);
            default:
                return acc += chalk_1.default.magenta(curr);
        }
    }, '');
}
//# sourceMappingURL=index.js.map