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
// ref = song whose melody moves UP by this interval; refDown = moves DOWN
const INTERVALS = [
  { semitones: 0,  name: 'Perfect Unison',    abbr: 'P1',  ref: 'Same note',                       refDown: 'Same note' },
  { semitones: 1,  name: 'Minor 2nd',          abbr: 'm2',  ref: 'Jaws theme',                      refDown: 'Für Elise' },
  { semitones: 2,  name: 'Major 2nd',          abbr: 'M2',  ref: 'Happy Birthday',                  refDown: 'Mary Had a Little Lamb' },
  { semitones: 3,  name: 'Minor 3rd',          abbr: 'm3',  ref: 'Smoke on the Water',              refDown: 'Hey Jude' },
  { semitones: 4,  name: 'Major 3rd',          abbr: 'M3',  ref: 'When the Saints Go Marching In',  refDown: 'Beethoven\'s 5th Symphony' },
  { semitones: 5,  name: 'Perfect 4th',        abbr: 'P4',  ref: 'Here Comes the Bride',            refDown: 'Eine kleine Nachtmusik' },
  { semitones: 6,  name: 'Tritone',            abbr: 'TT',  ref: 'The Simpsons',                    refDown: 'Black Sabbath (riff)' },
  { semitones: 7,  name: 'Perfect 5th',        abbr: 'P5',  ref: 'Star Wars Theme',                 refDown: 'The Flintstones' },
  { semitones: 8,  name: 'Minor 6th',          abbr: 'm6',  ref: 'The Entertainer',                 refDown: 'Love Story (Where Do I Begin)' },
  { semitones: 9,  name: 'Major 6th',          abbr: 'M6',  ref: 'My Way',                          refDown: 'Nobody Knows the Trouble I\'ve Seen' },
  { semitones: 10, name: 'Minor 7th',          abbr: 'm7',  ref: 'Somewhere (West Side Story)',     refDown: 'Watermelon Man' },
  { semitones: 11, name: 'Major 7th',          abbr: 'M7',  ref: 'Take On Me',                      refDown: 'I Love You (Cole Porter)' },
  { semitones: 12, name: 'Perfect Octave',     abbr: 'P8',  ref: 'Somewhere Over the Rainbow',      refDown: 'Willow Weep for Me' },
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

/* ══════════════════════════════════════════
   Progression chords — major key + modal interchange
   Every chord is relative to a MAJOR tonic. Non-diatonic chords are
   "borrowed" from parallel modes or are common chromatic colours.
   root = semitones above the tonic; intervals = from the chord root.
   ══════════════════════════════════════════ */
const MAJ = [0,4,7], MIN = [0,3,7], DIM = [0,3,6], SUS2 = [0,2,7], SUS4 = [0,5,7];
const DOM7 = [0,4,7,10], DIM7 = [0,3,6,9];

const PROG_CHORDS = [
  // Diatonic
  { id: 'I',      label: 'I',      root: 0,  intervals: MAJ,  group: 'diatonic', desc: 'Tonic — home' },
  { id: 'ii',     label: 'ii',     root: 2,  intervals: MIN,  group: 'diatonic', desc: 'Supertonic — leads to V' },
  { id: 'iii',    label: 'iii',    root: 4,  intervals: MIN,  group: 'diatonic', desc: 'Mediant — soft, ambiguous' },
  { id: 'IV',     label: 'IV',     root: 5,  intervals: MAJ,  group: 'diatonic', desc: 'Subdominant — moving away' },
  { id: 'V',      label: 'V',      root: 7,  intervals: MAJ,  group: 'diatonic', desc: 'Dominant — wants to resolve' },
  { id: 'vi',     label: 'vi',     root: 9,  intervals: MIN,  group: 'diatonic', desc: 'Relative minor' },
  { id: 'viio',   label: 'vii°',   root: 11, intervals: DIM,  group: 'diatonic', desc: 'Leading-tone diminished' },
  // Borrowed from the parallel minor (Aeolian) and Mixolydian
  { id: 'i',      label: 'i',      root: 0,  intervals: MIN,  group: 'borrowed', from: 'parallel minor', desc: 'Minor tonic — sudden darkness' },
  { id: 'iio',    label: 'ii°',    root: 2,  intervals: DIM,  group: 'borrowed', from: 'parallel minor', desc: 'Diminished ii — dark pre-dominant' },
  { id: 'bIII',   label: 'bIII',   root: 3,  intervals: MAJ,  group: 'borrowed', from: 'parallel minor', desc: 'Rock / blues colour' },
  { id: 'iv',     label: 'iv',     root: 5,  intervals: MIN,  group: 'borrowed', from: 'parallel minor', desc: 'The "sad IV" — bittersweet' },
  { id: 'v',      label: 'v',      root: 7,  intervals: MIN,  group: 'borrowed', from: 'Mixolydian / minor', desc: 'Minor v — soft, modal' },
  { id: 'bVI',    label: 'bVI',    root: 8,  intervals: MAJ,  group: 'borrowed', from: 'parallel minor', desc: 'Epic, cinematic lift' },
  { id: 'bVII',   label: 'bVII',   root: 10, intervals: MAJ,  group: 'borrowed', from: 'Mixolydian / minor', desc: 'Rock cadence chord' },
  // Other modal / chromatic colours
  { id: 'bII',    label: 'bII',    root: 1,  intervals: MAJ,  group: 'chromatic', from: 'Phrygian (Neapolitan)', desc: 'Dramatic half-step above home' },
  { id: 'II',     label: 'II',     root: 2,  intervals: MAJ,  group: 'chromatic', from: 'Lydian (V of V)', desc: 'Bright, dreamy lift' },
  { id: 'III',    label: 'III',    root: 4,  intervals: MAJ,  group: 'chromatic', from: 'V of vi', desc: 'Pulls toward vi' },
  // Suspended
  { id: 'Isus2',  label: 'Isus2',  root: 0,  intervals: SUS2, group: 'sus', desc: 'Open tonic' },
  { id: 'Isus4',  label: 'Isus4',  root: 0,  intervals: SUS4, group: 'sus', desc: 'Tonic waiting to resolve' },
  { id: 'iisus2', label: 'iisus2', root: 2,  intervals: SUS2, group: 'sus', desc: 'ii with an open, floating sound' },
  { id: 'IVsus2', label: 'IVsus2', root: 5,  intervals: SUS2, group: 'sus', desc: 'Airy subdominant' },
  { id: 'Vsus4',  label: 'Vsus4',  root: 7,  intervals: SUS4, group: 'sus', desc: 'Dominant with suspense' },
];

/* Applied (secondary) chords: numeral X of the chord Y, written X/Y.
   Played as 7th chords: V/Y as a dominant 7th, vii°/Y as a diminished 7th. */
const SLASH_TARGETS = ['ii', 'iii', 'IV', 'V', 'vi'];
SLASH_TARGETS.forEach(t => {
  const target = PROG_CHORDS.find(c => c.id === t);
  PROG_CHORDS.push(
    { id: `V/${t}`,    label: `V/${target.label}`,    numeral: 'V',    target: t, root: (target.root + 7) % 12,
      intervals: DOM7, group: 'applied', from: 'secondary dominant', desc: `Dominant 7th that pulls to ${target.label}` },
  );
});
SLASH_TARGETS.forEach(t => {
  const target = PROG_CHORDS.find(c => c.id === t);
  PROG_CHORDS.push(
    { id: `viio/${t}`, label: `vii°/${target.label}`, numeral: 'viio', target: t, root: (target.root + 11) % 12,
      intervals: DIM7, group: 'applied', from: 'secondary leading-tone', desc: `Diminished 7th that leads into ${target.label}` },
  );
});
const PROG_CHORD_BY_ID = Object.fromEntries(PROG_CHORDS.map(c => [c.id, c]));

/* Numerals offered on the left of the slash (every non-applied chord) */
const NUMERAL_IDS = PROG_CHORDS.filter(c => c.group !== 'applied').map(c => c.id);

/**
 * The pitch classes (relative to the tonic) that an answer names.
 * "X" alone is the chord X. "X/Y" is X built in the key of Y's root;
 * V/Y becomes a dominant 7th and vii°/Y a diminished 7th.
 * Answers are graded by comparing these, so equivalent spellings
 * (e.g. IV/IV and bVII) are both accepted.
 */
function chordPitchClasses(numeralId, targetId = null) {
  const n = PROG_CHORD_BY_ID[numeralId];
  let root = n.root, ints = n.intervals;
  if (targetId) {
    root = (PROG_CHORD_BY_ID[targetId].root + n.root) % 12;
    if (numeralId === 'V')    ints = DOM7;
    if (numeralId === 'viio') ints = DIM7;
  }
  return [...new Set(ints.map(i => (root + i) % 12))].sort((a, b) => a - b);
}

/** Split a chord id into its answer parts: { numeral, target }. */
function chordAnswerParts(id) {
  const c = PROG_CHORD_BY_ID[id];
  return c.group === 'applied' ? { numeral: c.numeral, target: c.target } : { numeral: id, target: null };
}

function sameSound(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/* ── Difficulty levels: which chords can appear ── */
const PROG_PALETTES = (() => {
  const l1 = ['I', 'IV', 'V', 'vi'];
  const l2 = ['I', 'ii', 'iii', 'IV', 'V', 'vi'];
  const l3 = [...l2, 'iv', 'bVII', 'bVI'];
  const l4 = [...l3, 'viio', 'bIII', 'v', 'i'];
  const l5 = [...l4, 'iio', 'bII', 'II', 'III', 'Isus2', 'Isus4', 'iisus2', 'IVsus2', 'Vsus4'];
  const l6 = [...l5, ...SLASH_TARGETS.map(t => `V/${t}`)];
  const l7 = [...l6, ...SLASH_TARGETS.map(t => `viio/${t}`)];
  return [l1, l2, l3, l4, l5, l6, l7];
})();

/** Sort chord ids into display order (diatonic, borrowed, chromatic, sus). */
function sortProgChords(ids) {
  const order = PROG_CHORDS.map(c => c.id);
  return [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * Random progression starting on I. Diatonic chords are weighted 3:1 over
 * borrowed/colour chords so progressions still sound like they're in a key.
 * No chord repeats back-to-back. An applied chord (V/x, vii°/x) is always
 * followed by the chord it resolves to, so it never appears last.
 */
function randomProgression(palette, length) {
  const chords = ['I'];
  while (chords.length < length) {
    const prev    = chords[chords.length - 1];
    const lastPos = chords.length === length - 1;
    let options = palette.filter(id => id !== prev && !(lastPos && PROG_CHORD_BY_ID[id].group === 'applied'));
    if (!options.length) options = ['IV', 'V', 'vi'].filter(id => id !== prev); // e.g. custom set of only I + applied chords
    const weights = options.map(id => PROG_CHORD_BY_ID[id].group === 'diatonic' ? 3 : 1);
    let r = Math.random() * weights.reduce((s, w) => s + w, 0);
    let pick = options[options.length - 1];
    for (let i = 0; i < options.length; i++) { r -= weights[i]; if (r < 0) { pick = options[i]; break; } }
    chords.push(pick);
    const target = PROG_CHORD_BY_ID[pick].target;
    if (target) chords.push(target); // resolve the applied chord
  }
  return chords;
}

/**
 * MIDI notes for a progression chord. High roots drop an octave so the
 * progression stays in one register.
 */
function progChordNotes(id, tonicMidi) {
  const ch   = PROG_CHORD_BY_ID[id];
  const base = tonicMidi + ch.root - (ch.root > 6 ? 12 : 0);
  return ch.intervals.map(i => base + i);
}

function progressionLabel(ids) {
  return ids.map(id => PROG_CHORD_BY_ID[id].label).join(' – ');
}

/* ── Scale playback modes ── */
const SCALE_PLAY_MODES = [
  { id: 'ascending',  label: 'Ascending',     desc: 'Root up to the octave' },
  { id: 'descending', label: 'Descending',    desc: 'Octave down to the root' },
  { id: 'updown',     label: 'Up & down',     desc: 'Ascending, then back down' },
  { id: 'random',     label: 'Random order',  desc: 'Tonic first, then the other notes shuffled' },
  { id: 'diads',      label: 'Random diads',  desc: 'Tonic first, then random two-note pairs until every note has sounded' },
  { id: 'mixed',      label: 'Mixed',         desc: 'A different playback style each question' },
];

/* ── Named progressions for the Learn tab ── */
const LEARN_PROGRESSIONS = [
  // Diatonic
  { chords: ['I', 'IV', 'V', 'I'],    desc: 'Classic blues / rock' },
  { chords: ['I', 'V', 'vi', 'IV'],   desc: 'Axis — the pop staple' },
  { chords: ['ii', 'V', 'I'],         desc: 'Jazz cadence' },
  { chords: ['I', 'vi', 'IV', 'V'],   desc: '50s doo-wop' },
  { chords: ['vi', 'IV', 'I', 'V'],   desc: 'Axis starting on vi' },
  { chords: ['IV', 'V', 'iii', 'vi'], desc: 'Royal Road (J-pop)' },
  { chords: ['I', 'V', 'vi', 'iii'],  desc: 'Pachelbel\'s Canon (opening)' },
  { chords: ['vi', 'ii', 'V', 'I'],   desc: 'Circle of fifths' },
  // Borrowed chords
  { chords: ['I', 'bVII', 'IV', 'I'], desc: 'Rock cadence — bVII borrowed from Mixolydian' },
  { chords: ['I', 'IV', 'iv', 'I'],   desc: 'Minor plagal — major IV turns to minor iv' },
  { chords: ['I', 'bVI', 'bVII', 'I'], desc: 'Epic "victory" cadence — both borrowed from minor' },
  { chords: ['I', 'bIII', 'IV', 'I'], desc: 'Rock lift with borrowed bIII' },
  { chords: ['I', 'V', 'vi', 'iv'],   desc: 'Axis with a bittersweet minor iv' },
  { chords: ['I', 'II', 'IV', 'I'],   desc: 'Lydian II — dreamy, film-score' },
  { chords: ['I', 'bII', 'I'],        desc: 'Phrygian / Neapolitan colour' },
  { chords: ['I', 'iisus2', 'Vsus4', 'V'], desc: 'Suspended chords resolving' },
].map(p => ({ ...p, id: p.chords.join('-'), name: progressionLabel(p.chords) }));

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
