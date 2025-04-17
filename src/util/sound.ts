import { spawn } from 'child_process';

export function playSineWave(frequency: number, duration: number): void {
    const sineWave = generateSineWave(frequency, duration);
  
    // Use a system player (ffplay, afplay, or aplay) to play the raw PCM
    const player = spawn('ffplay', ['-f', 's16le', '-ar', '44100', '-ac', '1', '-i', '-']);
    
    // Pipe the sine wave to the player
    player.stdin.write(sineWave);
    player.stdin.end();
  
    // Listen for the player process closing
  }

function generateSineWave(frequency: number, duration: number, sampleRate: number = 44100): Buffer {
    const samples: number[] = [];
    const numSamples = Math.floor(duration * sampleRate);
  
    // Generate the sine wave samples
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * time);
      // Scale to 16-bit signed PCM range
      samples.push(Math.floor(sample * 32767)); // PCM 16-bit range [-32767, 32767]
    }
  
    // Convert to a Buffer using Int16Array
    return Buffer.from(new Int16Array(samples).buffer);
}