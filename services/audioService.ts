let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return null;
        }
    }
    return audioContext;
};

// This function must be called inside a user gesture handler (e.g., a click event)
// to ensure the AudioContext can be resumed if it was suspended by the browser's autoplay policy.
const ensureAudioContextResumed = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }
}

/**
 * Plays a pleasant, rising tone for a correct answer.
 */
export const playCorrectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureAudioContextResumed();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01); // Ramp up volume

    // A pleasant C5 to G5 chord-like sound
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2); // Fade out
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
};

/**
 * Plays a low, "buzzy" tone for an incorrect answer.
 */
export const playIncorrectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureAudioContextResumed();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime); // Low buzz
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01); // Ramp up
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25); // Fade out

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
};

/**
 * Plays a "ba-dum-tss" drum sound for a joke.
 */
export const playJokeSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureAudioContextResumed();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);
    
    // "Ba"
    const drum1 = ctx.createOscillator();
    drum1.type = 'triangle';
    drum1.frequency.setValueAtTime(150, now);
    drum1.connect(gain);
    drum1.start(now);
    drum1.stop(now + 0.1);

    // "Dum"
    const drum2 = ctx.createOscillator();
    drum2.type = 'triangle';
    drum2.frequency.setValueAtTime(120, now + 0.15);
    drum2.connect(gain);
    drum2.start(now + 0.15);
    drum2.stop(now + 0.25);

    // "Tss" - using filtered noise
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, bufferSize);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now + 0.3)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    
    noise.connect(bandpass).connect(noiseGain).connect(ctx.destination);

    noise.start(now + 0.3);
    noise.stop(now + 0.8);
};