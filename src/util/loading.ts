import { clearInterval } from "timers";
const readline = require('readline')

const icon_frame:string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let i:number = 0;
let interval

function startLoader():string{
    i = 0
    
    interval = setInterval(() => {
    process.stdout.write('\r' + icon_frame[i = ++i % icon_frame.length]);
    }, 80);
    return 'loading'
}

function endLoader(){
    clearInterval(interval)
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    return 'not loading'
}
