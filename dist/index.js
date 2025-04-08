#! /usr/bin/env node
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
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const events_json_1 = require("./events.json");
const get_windows_1 = require("get-windows");
const nice_table_1 = require("nice-table");
const prompts_1 = require("@inquirer/prompts");
const nodeplotlib_1 = require("nodeplotlib");
const child_process_1 = require("child_process");
const storage = __importStar(require("./util/storage"));
const settingsUtil = __importStar(require("./util/settings"));
const path_1 = __importDefault(require("path"));
var Scrambow = require('scrambow').Scrambow;
const cfonts = require('cfonts');
const cli_title_json_1 = require("./cli-title.json");
const program = new commander_1.Command();
var saved_data = storage.loadData();
//main_window_id
let main_window_id = null;
//timer variables**********************************
let timer_running = false;
let startTime = null;
let space_been_pressed = false;
let new_scramble = false;
let solve_labelled = false;
const node_global_key_listener_1 = require("@futpib/node-global-key-listener");
const listener = new node_global_key_listener_1.GlobalKeyboardListener();
//*************************************************
//*************************************************
console.log(cli_title_json_1.string);
program
    .version("1.0.18")
    .description("fast and lightweight CLI timer for speedcubing. Cstimer in the command line (in progress)");
program
    .command('graph')
    .argument('<property>', 'desired statistic to graph')
    .description(`generate a graph of one of the below stats: \n
    session_mean \n
    standard_deviation \n
    variance \n 
    fastest_solve \n
    slowest_solve`)
    .action((property) => {
    const property_keys = ['fastest_solve', 'session_mean', 'standard_deviation', 'variance', 'slowest_solve', 'all'];
    function normalizeArg(arg) {
        const aliases = {
            fastest_solve: ['f', 'b', 'best', 'fast', 'fastest', 'fastest_time'],
            slowest_solve: ['w', 's', 'worst', 'slow', 'slowest', 'slowest_timer'],
            session_mean: ['m', 'mean', 'avg', 'average', 'session_mean'],
            standard_deviation: ['dev', 'standard_deviation', 'std.dev', 'deviation', 'd'],
            variance: ['var', 'v', 'variance', 'var.'],
            all: ['*']
        };
        for (const [key, val] of Object.entries(aliases)) {
            if ((key === arg) || (val.includes(arg))) {
                return key;
            }
        }
        return null;
    }
    const normalized_property = normalizeArg(property);
    if (normalized_property !== null) {
        const session_data = storage.loadStats().session_data;
        if (session_data.size >= 0) {
            const x_dates = Array.from(session_data.keys())
                .map((ISO_date) => {
                return new Date(ISO_date);
            });
            const retrieve_data = (property) => {
                const y_data = x_dates.map((date) => {
                    return session_data.get(date.toISOString())[property];
                });
                return {
                    x: x_dates,
                    y: y_data,
                    type: 'scatter'
                };
            };
            switch (normalized_property) {
                case 'all':
                    const data = property_keys.map((property) => {
                        return retrieve_data(property);
                    });
                    (0, nodeplotlib_1.plot)(data);
                    break;
                default:
                    (0, nodeplotlib_1.plot)([retrieve_data(normalized_property)]);
                    break;
            }
        }
        else {
            console.log(`error: ` + chalk_1.default.red(`Session data.size === 0`));
        }
    }
    else {
        console.log(chalk_1.default.red(`${property}`) + ` is not a valid property. Below are the valid values`);
        console.log("session_mean \n" +
            "standard_deviation \n" +
            "variance \n" +
            "fastest_solve \n" +
            "slowest_solve");
    }
});
program
    .command('scramble')
    .argument('<format>', `Format of the scramble(s) you'd like to generate`)
    .argument('[number]', 'number of scrambles to generate', '1')
    .argument('[length]', `Length of the scramble`)
    .description('Generate a scramble')
    .action((event, count, length) => {
    var _a;
    const normalized_event = event
        .toLowerCase()
        .trim();
    if (!validEvent(normalized_event)) {
        console.log(chalk_1.default.redBright(`invalid event`));
        return;
    }
    count = count
        .toLowerCase()
        .trim();
    const current_settings = settingsUtil.loadSettings();
    const scramble_length = (_a = Number(length)) !== null && _a !== void 0 ? _a : current_settings.scramble_length;
    if ((scramble_length <= 0) || (scramble_length > 40)) {
        console.log(chalk_1.default.red(`invalid length`));
        return;
    }
    var scramble_generator = new Scrambow();
    let scramble = scramble_generator
        .setType(normalized_event)
        .setLength(scramble_length)
        .get(Number(count))
        .map((scramble_object, index) => {
        return `${index + 1}) ${stylizeScramble(scramble_object.scramble_string)}`;
    })
        .join(`\n`);
    console.log(scramble);
});
program
    .command('start')
    .argument('[event]', 'the event you wish to practice', '333')
    .option('-f, --focusMode', 'Displays only the most important stats')
    .option('-w --window', 'Opens a second command prompt window to display the informationa and stats related to the solve')
    .description('Begin a session of practicing a certain event')
    .action((event, options) => {
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
});
program
    .command("settings")
    .argument("[property]", "configure the cli to your liking")
    .action((setting_to_change) => {
    let current_settings = settingsUtil.loadSettings();
    const settings_list = Object.keys(current_settings);
    if (setting_to_change === undefined) {
        console.log(chalk_1.default.green(`Configure any of the below to some new and preferred value`));
        console.table(current_settings);
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
program
    .command('show-session')
    .action(() => {
    const menu_length = settingsUtil.loadSettings().show_session_menu_length;
    function newChoices(menu_page) {
        const session_array = Array.from(storage.loadData().data.values());
        let menu_choices = session_array
            .map((session) => {
            return {
                name: session.date_formatted,
                value: session.date
            };
        }).filter((v, index) => {
            return (index >= menu_page * (menu_length)) && (index < ((menu_page + 1) * menu_length));
        });
        if (menu_page !== 0) {
            menu_choices.unshift({
                name: chalk_1.default.blue(`Back`),
                value: 'back'
            });
        }
        if (session_array[(menu_page + 1) * menu_length] !== undefined) {
            menu_choices.push({
                name: chalk_1.default.blue(`next`),
                value: 'next'
            });
        }
        (0, prompts_1.select)({
            message: `Select the session you'd like to observe`,
            choices: menu_choices
        }).then((value) => {
            switch (value) {
                case 'back':
                    newChoices(menu_page - 1);
                    break;
                case 'next':
                    newChoices(menu_page + 1);
                    break;
                default:
                    const current_session_data = storage.loadData().data.get(value);
                    let info_table = current_session_data.entries.map((instance, index) => {
                        const label = (instance.label === "DNF") ? chalk_1.default.red(instance.label) : instance.label;
                        return {
                            n: index + 1,
                            time: instance.time.toFixed(3),
                            label: label !== null && label !== void 0 ? label : chalk_1.default.green('OK'),
                        };
                    });
                    console.log(`\n`);
                    console.log((0, nice_table_1.createTable)(info_table, ['n', 'time', 'label']));
                    const current_session_stats = storage.loadStats().session_data.get(value);
                    if (current_session_stats !== undefined) {
                        console.log(Object.keys(current_session_stats).map((key_name) => {
                            return `${key_name}: ${current_session_stats[key_name].toFixed(3)} ${chalk_1.default.green('s')}`;
                        })
                            .join(chalk_1.default.blue('\n')));
                    }
                    else {
                        console.log(`Statistics unavailable`);
                    }
                    break;
            }
        }).catch((err) => {
            console.log(chalk_1.default.red(`An error has occurred:${err}`));
        });
    }
    newChoices(0);
});
program.parse(process.argv);
function updateSetting(current_settings, property) {
    let prompt;
    switch (typeof current_settings[property]) {
        case 'number': prompt = prompts_1.number;
        case 'string': prompt = prompts_1.input;
    }
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
    main_window_id = (0, get_windows_1.activeWindowSync)().id;
    console.clear();
    const session = Date.now();
    const session_date = new Date(session);
    const session_date_ISO = session_date.toISOString();
    cfonts.say(`session: ${session}`, {
        font: 'tiny', // define the font face
        align: 'center', // define text alignment
        colors: ['magenta'],
        background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
        letterSpacing: 1, // define letter spacing
    });
    const current_settings = settingsUtil.loadSettings();
    saved_data.data.set(session_date_ISO, storage.newSessionLog(session_date, event));
    saved_data.last_accessed_log = session_date_ISO;
    storage.saveData(saved_data);
    new_scramble = true;
    listener.kill();
    if (options.window || options.w) {
        const scriptPath = path_1.default.join(__dirname, 'window.js');
        const cmd = (0, child_process_1.spawn)('cmd.exe', ['/K', `start cmd /K node ${scriptPath} ${session_date.toISOString()}`], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false
        });
        cmd.unref(); // Allow the parent process to exit without waiting for this new process
        cmd.on('error', (err) => console.error(`Process error: ${err.message}`));
    }
    newSolve(current_settings, event, session_date, options);
}
function newSolve(current_settings, event, session_date, option) {
    const session_date_ISO = session_date.toISOString();
    var scramble_generator = new Scrambow();
    process.stdin.resume();
    let scramble = scramble_generator
        .setType(event)
        .setLength(current_settings.scramble_length)
        .get(1)[0]
        .scramble_string;
    process.stdout.write(`\x1b[2K\r`);
    console.log(chalk_1.default.bold.red(`Scramble:`));
    process.stdout.write("\x1b[2K");
    console.log(stylizeScramble(scramble));
    listener.addListener(function (e, down) {
        process.stdout.write('\x1b[2K\r');
        if ((0, get_windows_1.activeWindowSync)().id !== main_window_id) {
            return;
        }
        if ((e.name === "D") && (e.state === "UP") && (!new_scramble)) {
            const current_session = saved_data.data.get(session_date_ISO);
            if (current_session.entries.length >= 1) {
                current_session.entries.pop();
                console.log(chalk_1.default.blue(`Last solve deleted`));
                saved_data.data.set(session_date_ISO, current_session);
                storage.saveData(saved_data);
            }
            else {
                console.log(chalk_1.default.red(`There exist no entries in the current session to delete`));
            }
            return;
        }
        if ((e.name === "N") && (e.state === "UP")) {
            if (!new_scramble) {
                process.stdout.write('\x1b[2K');
                listener.kill();
                new_scramble = true;
                solve_labelled = false;
                newSolve(current_settings, event, session_date, option);
            }
            return;
        }
        if ((e.name === "E") && (e.state === "UP") && (!new_scramble)) {
            if (!solve_labelled) {
                solve_labelled = true;
                const current_session = saved_data.data.get(session_date_ISO);
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
                        saved_data.data.set(session_date_ISO, current_session);
                        storage.saveData(saved_data);
                        console.log(chalk_1.default.green(`Last solve labelled ${answer}`));
                        console.log(chalk_1.default.bold.magentaBright(`Whenever ready use the spacebar to start a new solve`));
                    }).catch((err) => {
                        console.log(chalk_1.default.red(`An error has occurred:${err}`));
                    });
                }
                else {
                    console.log(chalk_1.default.redBright(`There exist no entries in the current session to label`));
                }
                console.log(`\n \n`);
                return;
            }
            else {
                console.log(chalk_1.default.redBright(`The solve has already been labelled.`));
                return;
            }
        }
        if ((e.name === "SPACE") && (new_scramble)) {
            if (!timer_running) {
                if (e.state === "DOWN") {
                    if (!space_been_pressed) {
                        space_been_pressed = true;
                        process.stdout.write(chalk_1.default.bgRed('...') + `\n`);
                    }
                    else {
                        process.stdout.write("\b \b");
                    }
                }
                else {
                    if (space_been_pressed) {
                        space_been_pressed = false;
                        process.stdout.write("\x1b[F"); //move back up a line
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
                    new_scramble = false;
                    const current_session = saved_data.data.get(session_date_ISO);
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
                    const current_Ao5 = storage.Ao5(current_session);
                    const current_Ao12 = storage.Ao12(current_session);
                    stats_data.session_data.set(session_date_ISO, current_stats);
                    stats_data.pb_Ao5 = (current_Ao5 < stats_data.pb_Ao5) ? current_Ao5 : stats_data.pb_Ao5;
                    stats_data.pb_Ao12 = (current_Ao12 < stats_data.pb_Ao12) ? current_Ao12 : stats_data.pb_Ao12;
                    storage.saveStats(stats_data);
                    saved_data.data.set(session_date_ISO, current_session);
                    storage.saveData(saved_data);
                    process.stdout.write("\b \b");
                    cfonts.say(`${elapsedTime.toFixed(2)}s`, {
                        font: 'block', // define the font face
                        align: 'center', // define text alignment
                        colors: ['white'],
                        background: 'transparent', // define the background color, you can also use `backgroundColor` here as key
                        letterSpacing: 1, // define letter spacing
                    });
                    process.stdout.write("\b \b");
                    console.log(chalk_1.default.bold(`Time: `) + elapsedTime.toFixed(4) + chalk_1.default.green('s') +
                        `\n`);
                    console.log(chalk_1.default.bold(`Ao5: `) + chalk_1.default.magenta(current_Ao5 !== null && current_Ao5 !== void 0 ? current_Ao5 : "--") + chalk_1.default.green(`s`));
                    console.log(chalk_1.default.bold(`Ao12: `) + chalk_1.default.magenta(current_Ao12 !== null && current_Ao12 !== void 0 ? current_Ao12 : "--") + chalk_1.default.green(`s`) +
                        `\n \n`);
                    if (!(option.focusMode || option.f) && !(option.w || option.window)) {
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
                        console.log(chalk_1.default.bold.magentaBright(`Whenever ready use the spacebar to start a new solve using`) + chalk_1.default.italic.yellow(` n`) +
                            `\n \n`);
                    }
                    //reset
                    timer_running = false;
                    startTime = null;
                    space_been_pressed = false;
                }
            }
            return;
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
    const colorMap = {
        'r': chalk_1.default.redBright,
        'l': chalk_1.default.blueBright,
        'u': chalk_1.default.blueBright,
        'd': chalk_1.default.greenBright,
        "'": chalk_1.default.whiteBright,
        '2': chalk_1.default.blue,
        'F': chalk_1.default.cyan.underline,
    };
    return scramble
        .trim()
        .split('')
        .map(char => {
        const stylize = colorMap[char] || chalk_1.default.cyan;
        return stylize(char);
    })
        .join('');
}
//# sourceMappingURL=index.js.map