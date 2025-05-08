"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playSineWave = playSineWave;
const opts = {};
var player = require('play-sound')(opts);
function playSineWave(sound_name) {
    player.play(`${sound_name}.wav`, function (err) {
        if (err)
            throw err;
    });
}
//# sourceMappingURL=sound.js.map