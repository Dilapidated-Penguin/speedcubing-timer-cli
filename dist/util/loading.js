"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timers_1 = require("timers");
const readline = require('readline');
const icon_frame = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let i = 0;
let interval;
function startLoader() {
    i = 0;
    interval = setInterval(() => {
        process.stdout.write('\r' + icon_frame[i = ++i % icon_frame.length]);
    }, 80);
    return 'loading';
}
function endLoader() {
    (0, timers_1.clearInterval)(interval);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    return 'not loading';
}
//# sourceMappingURL=loading.js.map