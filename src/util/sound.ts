// You can either use spawn or exec, the choice is often purely aesthetic,
// but spawn() doesn't spawn a shell, which is what we want here.
import { spawn } from "node:child_process";

// On Windows we can offload the work to PowerShell:
const winFn = (filePath) => spawn(`powershell`, [
  `-c`,
  `(`,
  `New-Object`,
  `Media.SoundPlayer`,
  `"${filePath}"`,
  `).PlaySync();`
]);

// On MacOS, we have afplay available:
const macFn = (filePath) => spawn(`afplay`, [filePath]);

// And on everything else, i.e. linux/unix, we can use aplay:
const nxFn = (filePath) => spawn(`aplay`, [filePath]);

// Then, because your OS doesn't change during a script
// run, we can simply bind the single function we'll need
// as "play(filePath)":
const { platform: os } = process;
const playAudioFile = (os === `win32`) ? winFn : (os === `darwin`) ? macFn : nxFn;

// And then we can just export that for use anywhere in our codebase.
export { playAudioFile }