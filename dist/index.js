const { Command } = require("commander");
const figlet = require("figlet");
const chalk = require("chalk");
import { randomScrambleForEvent } from "cubing/scramble";
const { event_choices, event_list } = require('./events.json');
import { select, number, input } from '@inquirer/prompts';
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
    if (event !== undefined) {
        const normalized_event = event
            .toLowerCase()
            .trim();
        if (validEvent(normalized_event)) {
            startSession(normalized_event, options);
        }
        else {
            console.log(chalk.red(`${event} is not a valid/supported event`));
        }
    }
    else {
        select({
            message: 'Select an event',
            choices: event_choices
        })
            .then((event_choice) => {
            startSession(event_choice, options);
        }).catch((error) => {
            console.log(chalk.bgRed(`An error occurred`));
        });
    }
    //cubeScramble = cube(Number(event), current_settings.scramble_length).toString()
});
program
    .Commmand("settings")
    .argument("[property]", "configure the cli to your liking")
    .action((setting_to_change) => {
    let current_settings = settingsUtil.loadSettings();
    const settings_list = Object.keys(current_settings);
    if (setting_to_change === undefined) {
        select({
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
    const prompt = (typeof current_settings[property] === 'number') ? number : input;
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
    return (event_list.indexOf(event_to_check) !== -1);
}
function startSession(event, options) {
    console.clear();
    const session_date = Date.now();
    console.log(figlet.textSync('session:'));
    console.log(figlet.textSync(`${session_date}`));
    const current_settings = settingsUtil.loadSettings();
    //scramble generator
    let scramble;
    randomScrambleForEvent(event).then((alg) => {
        console.log(chalk.magenta(alg.toString()));
        console.log(`\n`);
        console.log(chalk.inverse('Hold the' + chalk.bold('spacebar') + 'to start the timer!'));
    }).catch((err) => {
        console.log(chalk.red("and error occured generating the scramble"));
    });
}
function ScrambleStyle(scramble) {
    return scramble
        .trim()
        .split('')
        .map((char) => {
        switch (char) {
            case 'r':
                return chalk.redBright;
            case 'l':
                return chalk.blueBright;
            case 'u':
                return chalk.cyanBright;
            case 'd':
                return chalk.greenBright;
            case `'`:
                return chalk.whiteBright;
            default:
                return chalk.magenta;
        }
    });
}
//# sourceMappingURL=index.js.map