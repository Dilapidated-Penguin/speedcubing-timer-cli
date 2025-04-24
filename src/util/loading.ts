import { clearInterval } from "timers";
const readline = require('readline')

const icon_frame:string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let i:number = 0;
let interval

export function startLoader(){
    i = 0
    interval = setInterval(() => {
    process.stdout.write('\r' + icon_frame[i = ++i % icon_frame.length]);
    }, 80);
}

export function endLoader(){
    clearInterval(interval)
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
}
