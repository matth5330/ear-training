/* ============================================================
   theory.js — Music Theory Constants and Helpers
   ============================================================ */

const NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToName(midi, flat = false) {
  return (flat ? NOTES_FLAT : NOTES_SHARP)[midi % 12] + (Math.floor(midi / 12) - 1);
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate n choices including correct, drawn from pool.
 * idFn extracts the comparison key from each element.
 */
function generateChoices(correct, pool, n, idFn = (x => x)) {
  const others = shuffle(pool.filter(x => idFn(x) !== idFn(correct))).slice(0, n - 1);
  return shuffle([correct, ...others]);
}

/* ── Intervals ── */
const INTERVALS = [
  { semitones: 0,  name: 'Perfect Unison',    abbr: 'P1',  ref: 'Same note' },
  { semitones: 1,  name: 'Minor 2nd',          abbr: 'm2',  ref: 'Jaws theme' },
  { semitones: 2,  name: 'Major 2nd',          abbr: 'M2',  ref: 'Happy Birthday' },
  { semitones: 3,  name: 'Minor 3rd',          abbr: 'm3',  ref: 'Smoke on the Water' },
  { semitones: 4,  name: 'Major 3rd',          abbr: 'M3',  ref: 'When the Saints Go Marching In' },
  { semitones: 5,  name: 'Perfect 4th',        abbr: 'P4',  ref: 'Here Comes the Bride' },
  { semitones: 6,  name: 'Tritone',            abbr: 'TT',  ref: 'The Simpsons' },
  { semitones: 7,  name: 'Perfect 5th',        abbr: 'P5',  ref: 'Star Wars Theme' },
  { semitones: 8,  name: 'Minor 6th',          abbr: 'm6',  ref: 'The Entertainer' },
  { semitones: 9,  name: 'Major 6th',          abbr: 'M6',  ref: 'My Way' },
  { semitones: 10, name: 'Minor 7th',          abbr: 'm7',  ref: 'Somewhere (West Side Story)' },
  { semitones: 11, name: 'Major 7th',          abbr: 'M7',  ref: 'Take On Me' },
  { semitones: 12, name: 'Perfect Octave',     abbr: 'P8',  ref: 'Somewhere Over the Rainbow' },
];

/* ── Chord Types ── */
const CHORD_TYPES = [
  { id: 'maj',    name: 'Major',              abbr: 'maj',    intervals: [0,4,7],       character: 'Bright, happy, stable' },
  { id: 'min',    name: 'Minor',              abbr: 'min',    intervals: [0,3,7],       character: 'Dark, sad, introspective' },
  { id: 'dim',    name: 'Diminished',         abbr: 'dim',    intervals: [0,3,6],       character: 'Tense, unstable, dissonant' },
  { id: 'aug',    name: 'Augmented',          abbr: 'aug',    intervals: [0,4,8],       character: 'Mysterious, unsettled' },
  { id: 'sus2',   name: 'Suspended 2nd',      abbr: 'sus2',   intervals: [0,2,7],       character: 'Open, floating, airy' },
  { id: 'sus4',   name: 'Suspended 4th',      abbr: 'sus4',   intervals: [0,5,7],       character: 'Anticipatory, tense-resolving' },
  { id: 'dom7',   name: 'Dominant 7th',       abbr: '7',      intervals: [0,4,7,10],    character: 'Bluesy, wants to resolve' },
  { id: 'maj7',   name: 'Major 7th',          abbr: 'maj7',   intervals: [0,4,7,11],    character: 'Dreamy, jazzy, lush' },
  { id: 'min7',   name: 'Minor 7th',          abbr: 'min7',   intervals: [0,3,7,10],    character: 'Smooth, mellow, jazzy' },
  { id: 'm7b5',   name: 'Half Diminished',    abbr: 'm7b5',   intervals: [0,3,6,10],    character: 'Dark, moody, complex' },
  { id: 'dim7',   name: 'Diminished 7th',     abbr: 'dim7',   intervals: [0,3,6,9],     character: 'Very tense, dramatic' },
  { id: 'mmaj7',  name: 'Minor Major 7th',    abbr: 'mMaj7',  intervals: [0,3,7,11],    character: 'Eerie, cinematic tension' },
];

/* ── Scale Types ── */
const SCALE_TYPES = [
  { id: 'major',      name: 'Major',              intervals: [0,2,4,5,7,9,11,12],    character: 'Bright, happy, fundamental' },
  { id: 'natmin',     name: 'Natural Minor',       intervals: [0,2,3,5,7,8,10,12],    character: 'Dark, expressive, melancholic' },
  { id: 'harmmin',    name: 'Harmonic Minor',      intervals: [0,2,3,5,7,8,11,12],    character: 'Exotic, dramatic, Middle-Eastern' },
  { id: 'melmin',     name: 'Melodic Minor',       intervals: [0,2,3,5,7,9,11,12],    character: 'Smooth minor with jazzy lift' },
  { id: 'pentmaj',    name: 'Major Pentatonic',    intervals: [0,2,4,7,9,12],         character: 'Open, folk-like, universally pleasing' },
  { id: 'pentmin',    name: 'Minor Pentatonic',    intervals: [0,3,5,7,10,12],        character: 'Bluesy, rock, earthy' },
  { id: 'blues',      name: 'Blues',               intervals: [0,3,5,6,7,10,12],      character: 'Soulful, expressive, bent notes' },
  { id: 'dorian',     name: 'Dorian',              intervals: [0,2,3,5,7,9,10,12],    character: 'Minor with a major 6th, cool & jazzy' },
  { id: 'phrygian',   name: 'Phrygian',            intervals: [0,1,3,5,7,8,10,12],    character: 'Spanish, flamenco, dark & spicy' },
  { id: 'lydian',     name: 'Lydian',              intervals: [0,2,4,6,7,9,11,12],    character: 'Dreamy, floating, film music' },
  { id: 'mixolydian', name: 'Mixolydian',          intervals: [0,2,4,5,7,9,10,12],    character: 'Major with a flat 7, rock & roll' },
  { id: 'locrian',    name: 'Locrian',             intervals: [0,1,3,5,6,8,10,12],    character: 'Extremely tense, rarely used' },
  { id: 'wholetone',  name: 'Whole Tone',          intervals: [0,2,4,6,8,10,12],      character: 'Impressionistic, ambiguous, floaty' },
];

/* ── Scale Degrees ── */
const SCALE_DEGREES = [
  { degree: 1, solfege: 'Do',  name: 'Tonic',       semitone: 0  },
  { degree: 2, solfege: 'Re',  name: 'Supertonic',  semitone: 2  },
  { degree: 3, solfege: 'Mi',  name: 'Mediant',     semitone: 4  },
  { degree: 4, solfege: 'Fa',  name: 'Subdominant', semitone: 5  },
  { degree: 5, solfege: 'Sol', name: 'Dominant',    semitone: 7  },
  { degree: 6, solfege: 'La',  name: 'Submediant',  semitone: 9  },
  { degree: 7, solfege: 'Ti',  name: 'Leading Tone', semitone: 11 },
];

/* ── Progressive Level Arrays ── */
const INTERVAL_LEVELS = [
  [7, 12],
  [5, 7, 12],
  [4, 5, 7, 12],
  [3, 4, 5, 7, 12],
  [3, 4, 5, 7, 9, 12],
  [3, 4, 5, 6, 7, 8, 9, 12],
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
];

const CHORD_LEVELS = [
  ['maj', 'min'],
  ['maj', 'min', 'dim', 'aug'],
  ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'],
  ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'min7'],
  ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'dom7', 'maj7', 'min7', 'm7b5', 'dim7'],
];

const SCALE_LEVELS = [
  ['major', 'natmin'],
  ['major', 'natmin', 'harmmin', 'pentmaj', 'pentmin'],
  ['major', 'natmin', 'harmmin', 'melmin', 'pentmaj', 'pentmin', 'blues', 'dorian', 'mixolydian'],
  ['major', 'natmin', 'harmmin', 'melmin', 'pentmaj', 'pentmin', 'blues', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'wholetone'],
];

const FUNCTIONAL_LEVELS = [
  [1, 5],
  [1, 2, 3, 4, 5],
  [1, 2, 3, 4, 5, 6, 7],
];

/* ── Chord Progressions ── */
const CHORD_PROGRESSIONS = [
  { id: 'I_IV_V',    name: 'I – IV – V',      degrees: [0,5,7],   qualities: ['maj','maj','maj'],         description: 'Classic blues/rock' },
  { id: 'I_V_vi_IV', name: 'I – V – vi – IV', degrees: [0,7,9,5], qualities: ['maj','maj','min','maj'],    description: 'Axis / pop staple' },
  { id: 'ii_V_I',    name: 'ii – V – I',      degrees: [2,7,0],   qualities: ['min7','dom7','maj7'],       description: 'Jazz cadence' },
  { id: 'I_vi_IV_V', name: 'I – vi – IV – V', degrees: [0,9,5,7], qualities: ['maj','min','maj','maj'],    description: '50s doo-wop' },
  { id: 'vi_IV_I_V', name: 'vi – IV – I – V', degrees: [9,5,0,7], qualities: ['min','maj','maj','maj'],    description: 'Minor-start pop' },
  { id: 'I_V_IV',    name: 'I – V – IV',      degrees: [0,7,5],   qualities: ['maj','maj','maj'],         description: 'Country / reverse blues' },
];

/* ── Perfect Pitch Levels (note names) ── */
const PERFECT_PITCH_LEVELS = [
  ['C','G'],
  ['C','D','E','G','A'],
  ['C','D','E','F','G','A','B'],
  ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
];

/* ── Speed Multiplier Helper ── */
function getSpeedMult() {
  try {
    const sp = (typeof state !== 'undefined' && state.settings)
      ? state.settings.playbackSpeed || 'normal'
      : 'normal';
    return sp === 'fast' ? 0.65 : sp === 'slow' ? 1.6 : 1.0;
  } catch (e) { return 1.0; }
}
