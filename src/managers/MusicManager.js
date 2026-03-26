/**
 * MusicManager — procedural background music using Web Audio API oscillators.
 * Creates a spacey minor-key melody + bass loop that respects SoundManager volume.
 */
export default class MusicManager {
    constructor(scene) {
        this.scene = scene;
        this.ctx = null;
        this.playing = false;
        this.masterGain = null;
        this.melodyGain = null;
        this.bassGain = null;
        this.noiseGain = null;
        this.bpm = 120;
        this.stepIndex = 0;
        this.loopTimer = null;
        this.volume = 0.1;

        // Minor-key melody notes (frequencies in Hz) — A minor / spacey
        this.melodyNotes = [
            220.00, 261.63, 293.66, 261.63,   // A3 C4 D4 C4
            220.00, 196.00, 174.61, 196.00,   // A3 G3 F3 G3
            220.00, 261.63, 329.63, 293.66,   // A3 C4 E4 D4
            261.63, 220.00, 196.00, 174.61    // C4 A3 G3 F3
        ];

        // Bass notes (one octave lower, root notes)
        this.bassNotes = [
            110.00, 110.00, 130.81, 130.81,
            110.00, 110.00, 87.31, 98.00,
            110.00, 110.00, 130.81, 146.83,
            130.81, 110.00, 98.00, 87.31
        ];

        // Hi-hat pattern (1 = hit, 0 = rest)
        this.hihatPattern = [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0];
    }

    start() {
        if (this.playing) return;

        // Check if sound is enabled
        const soundLevel = localStorage.getItem('fortune-sound-level') || 'HIGH';
        if (soundLevel === 'OFF') return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            return; // Web Audio not supported
        }

        this.playing = true;
        this.volume = soundLevel === 'LOW' ? 0.05 : 0.1;

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);

        // Melody gain
        this.melodyGain = this.ctx.createGain();
        this.melodyGain.gain.value = 0.35;
        this.melodyGain.connect(this.masterGain);

        // Bass gain
        this.bassGain = this.ctx.createGain();
        this.bassGain.gain.value = 0.4;
        this.bassGain.connect(this.masterGain);

        // Hi-hat gain
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0.15;
        this.noiseGain.connect(this.masterGain);

        this.stepIndex = 0;
        this.scheduleStep();
    }

    scheduleStep() {
        if (!this.playing || !this.ctx) return;

        const stepDuration = (60 / this.bpm) * 0.5; // 8th notes

        this.playMelodyNote(this.melodyNotes[this.stepIndex % this.melodyNotes.length], stepDuration * 0.8);
        this.playBassNote(this.bassNotes[this.stepIndex % this.bassNotes.length], stepDuration * 0.9);

        if (this.hihatPattern[this.stepIndex % this.hihatPattern.length]) {
            this.playHihat(stepDuration * 0.1);
        }

        this.stepIndex++;

        this.loopTimer = setTimeout(() => this.scheduleStep(), stepDuration * 1000);
    }

    playMelodyNote(freq, duration) {
        if (!this.ctx || !this.melodyGain) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(env);
        env.connect(this.melodyGain);

        const now = this.ctx.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(1, now + 0.02);
        env.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }

    playBassNote(freq, duration) {
        if (!this.ctx || !this.bassGain) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;
        osc.connect(env);
        env.connect(this.bassGain);

        const now = this.ctx.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.6, now + 0.01);
        env.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }

    playHihat(duration) {
        if (!this.ctx || !this.noiseGain) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // High-pass filter for hi-hat sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        const env = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(env);
        env.connect(this.noiseGain);

        const now = this.ctx.currentTime;
        env.gain.setValueAtTime(1, now);
        env.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.start(now);
    }

    /** Switch to boss-wave vibe: faster tempo */
    setBossMode(isBoss) {
        this.bpm = isBoss ? 150 : 120;
    }

    /** Update volume based on current sound settings */
    updateVolume() {
        const soundLevel = localStorage.getItem('fortune-sound-level') || 'HIGH';
        if (soundLevel === 'OFF') {
            this.stop();
            return;
        }
        this.volume = soundLevel === 'LOW' ? 0.05 : 0.1;
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    stop() {
        this.playing = false;
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
        if (this.ctx && this.ctx.state !== 'closed') {
            try { this.ctx.close(); } catch (e) { /* ignore */ }
        }
        this.ctx = null;
        this.masterGain = null;
        this.melodyGain = null;
        this.bassGain = null;
        this.noiseGain = null;
    }

    destroy() {
        this.stop();
    }
}
