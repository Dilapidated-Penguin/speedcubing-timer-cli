
const Speaker = require('speaker')
const { Readable } = require('stream');

  // Use a system player (ffplay, afplay, or aplay) to play the raw PCM
  const speaker = new Speaker({
    channels: 2,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 44100     // 44,100 Hz sample rate
  });
  
export function playSineWave(frequency: number, duration: number): void {
  // Custom readable stream that generates PCM sine wave
  const sampleRate = 44100;     // samples per second
  const amplitude = 32760;      // max 16-bit signed int

  const sineWave = new Readable({
    read(size) {
      const samples = size / 2; // 2 bytes per sample for 16-bit
      const buffer = Buffer.alloc(size);

      for (let i = 0; i < samples; i++) {
        const t = (this.sampleCount || 0) / sampleRate;
        const sample = Math.round(amplitude * Math.sin(2 * Math.PI * frequency * t));
        buffer.writeInt16LE(sample, i * 2);
        this.sampleCount = (this.sampleCount || 0) + 1;

        // Stop after desired duration
        if (this.sampleCount >= sampleRate * duration) {
          this.push(null); // end the stream
          break;
        }
      }

      this.push(buffer);
    }
  });

  // Pipe into speaker
  sineWave.pipe(speaker);
}