"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playAudioFile = void 0;
// You can either use spawn or exec, the choice is often purely aesthetic,
// but spawn() doesn't spawn a shell, which is what we want here.
const node_child_process_1 = require("node:child_process");
// On Windows we can offload the work to PowerShell:
const winFn = (filePath) => (0, node_child_process_1.spawn)(`powershell`, [
    `-c`,
    `(`,
    `New-Object`,
    `Media.SoundPlayer`,
    `"${filePath}"`,
    `).PlaySync();`
]);
// On MacOS, we have afplay available:
const macFn = (filePath) => (0, node_child_process_1.spawn)(`afplay`, [filePath]);
// And on everything else, i.e. linux/unix, we can use aplay:
const nxFn = (filePath) => (0, node_child_process_1.spawn)(`aplay`, [filePath]);
// Then, because your OS doesn't change during a script
// run, we can simply bind the single function we'll need
// as "play(filePath)":
const { platform: os } = process;
const playAudioFile = (os === `win32`) ? winFn : (os === `darwin`) ? macFn : nxFn;
exports.playAudioFile = playAudioFile;
//# sourceMappingURL=sound.js.map