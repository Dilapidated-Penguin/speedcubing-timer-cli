const opts = {}
var player = require('play-sound')(opts)

export function playSineWave(sound_name:string){
  player.play(`${sound_name}.wav`, function(err){
    if (err) throw err
  })
}