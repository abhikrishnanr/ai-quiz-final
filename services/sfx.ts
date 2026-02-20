
// Synthesized Sound Effects using Web Audio API
// No external assets required

let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, startTime: number, vol: number = 0.1) => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const SFX = {
  init: () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  },

  playLock: () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Mechanical high-pitch blip
    createOscillator('square', 800, 0.1, now, 0.1);
    createOscillator('sine', 1200, 0.05, now + 0.05, 0.05);
  },

  playCorrect: () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Major triad arpeggio (success)
    createOscillator('triangle', 523.25, 0.4, now, 0.2); // C5
    createOscillator('triangle', 659.25, 0.4, now + 0.1, 0.2); // E5
    createOscillator('triangle', 783.99, 0.6, now + 0.2, 0.2); // G5
    createOscillator('sine', 1046.50, 0.8, now + 0.3, 0.1); // C6
  },

  playWrong: () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Dissonant descending slide
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  },

  playIntro: () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Futuristic swell
    createOscillator('sine', 200, 1.5, now, 0.1);
    createOscillator('sine', 400, 1.5, now, 0.1);
  },

  playTimerTick: () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Woodblock/Tick sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  },

  startAmbient: () => {
    const ctx = getCtx();
    if (ambientOsc) return; // Already playing

    ambientOsc = ctx.createOscillator();
    ambientGain = ctx.createGain();
    
    // Low, throbbing drone
    ambientOsc.type = 'sine';
    ambientOsc.frequency.setValueAtTime(60, ctx.currentTime);
    
    // Slight modulation (LFO effect manually via linear ramp not ideal but simple)
    // For a simple drone, just a constant low hum
    ambientGain.gain.setValueAtTime(0.0, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Fade in
    
    ambientOsc.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    ambientOsc.start();
  },

  stopAmbient: () => {
    if (ambientGain && ambientOsc) {
        const ctx = getCtx();
        ambientGain.gain.cancelScheduledValues(ctx.currentTime);
        ambientGain.gain.setValueAtTime(ambientGain.gain.value, ctx.currentTime);
        ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); // Fade out
        
        const oldOsc = ambientOsc;
        setTimeout(() => {
            try { oldOsc.stop(); } catch(e) {}
        }, 1100);
    }
    ambientOsc = null;
    ambientGain = null;
  }
};
