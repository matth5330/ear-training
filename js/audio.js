/* ============================================================
   audio.js — Web Audio API Engine
   ============================================================ */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.8;
    this._ready = false;
  }

  init() {
    if (this._ready) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this._ready = true;
    } catch (e) {
      console.error('AudioEngine: Web Audio API not available', e);
    }
  }

  async resume() {
    if (!this._ready) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  now() {
    if (!this._ready) this.init();
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * Play a single note with a piano-like harmonic timbre.
   * Uses additive synthesis: fundamental + harmonics with ADSR envelope.
   */
  playNote(midi, startTime = 0, duration = 1.0, volume = 0.5) {
    if (!this._ready) this.init();
    if (!this.ctx) return;

    const freq = midiToFreq(midi);
    const start = startTime || this.ctx.currentTime;

    // Harmonic partials: [multiplier, relative amplitude]
    const harmonics = [
      [1, 1.0],
      [2, 0.5],
      [3, 0.25],
      [4, 0.12],
      [5, 0.06],
    ];

    const noteGain = this.ctx.createGain();
    noteGain.connect(this.masterGain);

    // ADSR envelope
    const attack  = 0.005;
    const decay   = 0.06;
    const sustain = 0.45;
    const release = 0.5;

    noteGain.gain.setValueAtTime(0, start);
    noteGain.gain.linearRampToValueAtTime(volume, start + attack);
    noteGain.gain.linearRampToValueAtTime(volume * sustain, start + attack + decay);
    noteGain.gain.setValueAtTime(volume * sustain, start + duration - release);
    noteGain.gain.linearRampToValueAtTime(0, start + duration + 0.1);

    harmonics.forEach(([mult, amp]) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, start);

      const hGain = this.ctx.createGain();
      hGain.gain.setValueAtTime(amp, start);

      osc.connect(hGain);
      hGain.connect(noteGain);

      osc.start(start);
      osc.stop(start + duration + 0.15);
    });
  }

  /**
   * Play multiple notes simultaneously (chord).
   */
  playChord(notes, startTime = 0, duration = 1.5, volume = 0.35) {
    if (!this._ready) this.init();
    const start = startTime || this.ctx.currentTime;
    notes.forEach(midi => this.playNote(midi, start, duration, volume));
  }

  /**
   * Play notes one after another (arpeggio).
   */
  playArpeggio(notes, startTime = 0, spacing = 0.15, duration = 0.8, volume = 0.5) {
    if (!this._ready) this.init();
    const start = startTime || this.ctx.currentTime;
    notes.forEach((midi, i) => {
      this.playNote(midi, start + i * spacing, duration, volume);
    });
  }

  /**
   * Play a scale ascending (and optionally descending).
   * speed: multiplier (0.65=fast, 1.0=normal, 1.6=slow)
   */
  playScale(rootMidi, intervals, startTime = 0, ascending = true, speed = 1.0) {
    if (!this._ready) this.init();
    const start = startTime || this.ctx.currentTime;
    const spacing = 0.22 * speed;
    const dur     = 0.6  * speed;

    let notes = intervals.map(s => rootMidi + s);
    if (!ascending) notes = notes.reverse();

    notes.forEach((midi, i) => {
      this.playNote(midi, start + i * spacing, dur, 0.5);
    });

    return start + notes.length * spacing + dur;
  }

  /**
   * Play a I-IV-V-I cadence in the given root key (major).
   * Returns the time when the cadence ends.
   * speed: multiplier (0.65=fast, 1.0=normal, 1.6=slow)
   */
  playCadence(rootMidi, startTime = 0, speed = 1.0) {
    if (!this._ready) this.init();
    const start = startTime || this.ctx.currentTime;

    const major = [0, 4, 7];
    const chords = [
      major.map(s => rootMidi + s),       // I
      major.map(s => rootMidi + 5 + s),   // IV
      major.map(s => rootMidi + 7 + s),   // V
      major.map(s => rootMidi + s),       // I
    ];

    const chordDur = 0.55 * speed;
    const gap      = 0.65 * speed;

    chords.forEach((chord, i) => {
      this.playChord(chord, start + i * gap, chordDur, 0.3);
    });

    return start + chords.length * gap + chordDur;
  }
}

const audio = new AudioEngine();
