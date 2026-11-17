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
   Modes & diatonic harmony
   ══════════════════════════════════════════ */
const MODES = [
  { id: 'ionian',     name: 'Major',      intervals: [0,2,4,5,7,9,11], character: 'Bright and resolved' },
  { id: 'aeolian',    name: 'Minor',      intervals: [0,2,3,5,7,8,10], character: 'Dark, natural minor' },
  { id: 'dorian',     name: 'Dorian',     intervals: [0,2,3,5,7,9,10], character: 'Minor with a bright major IV' },
  { id: 'phrygian',   name: 'Phrygian',   intervals: [0,1,3,5,7,8,10], character: 'Minor with a tense bII' },
  { id: 'lydian',     name: 'Lydian',     intervals: [0,2,4,6,7,9,11], character: 'Major with a floating II' },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0,2,4,5,7,9,10], character: 'Major with a rock bVII' },
  { id: 'locrian',    name: 'Locrian',    intervals: [0,1,3,5,6,8,10], character: 'Unstable diminished tonic' },
];
const MAJOR_STEPS = [0,2,4,5,7,9,11];
const ROMAN       = ['I','II','III','IV','V','VI','VII'];

/**
 * Build the diatonic chord on a scale degree (0–6) of a mode.
 * Returns { root (semitones above tonic), intervals (from chord root), quality, label }.
 * Labels are roman numerals relative to the major scale, so Mixolydian's
 * 7th-degree chord reads "bVII", Lydian's 2nd reads "II", etc.
 */
function diatonicChord(modeId, degree, seventh = false) {
  const S    = MODES.find(m => m.id === modeId).intervals;
  const at   = k => S[(degree + k) % 7] + 12 * Math.floor((degree + k) / 7);
  const root = S[degree];
  const ints = [0, 2, 4].concat(seventh ? [6] : []).map(k => at(k) - root);
  const [, third, fifth, sev] = ints;

  let quality = 'maj';
  if (third === 3 && fifth === 7) quality = 'min';
  else if (third === 3 && fifth === 6) quality = 'dim';
  else if (third === 4 && fifth === 8) quality = 'aug';

  const diff   = root - MAJOR_STEPS[degree];
  const prefix = diff < 0 ? 'b' : diff > 0 ? '#' : '';
  const numeral = (quality === 'maj' || quality === 'aug') ? ROMAN[degree] : ROMAN[degree].toLowerCase();

  let suffix = quality === 'dim' ? '°' : quality === 'aug' ? '+' : '';
  if (seventh) {
    if (quality === 'maj') suffix = sev === 11 ? 'maj7' : '7';
    if (quality === 'min') suffix = sev === 11 ? '(maj7)' : '7';
    if (quality === 'dim') suffix = sev === 10 ? 'ø7' : '°7';
  }
  return { root, intervals: ints, quality, label: prefix + numeral + suffix };
}

function progressionName(modeId, degrees, sevenths = false) {
  return degrees.map(d => diatonicChord(modeId, d, sevenths).label).join(' – ');
}

/* ── Named progression library ──
   degrees are 0-indexed scale degrees (0 = tonic).
   tier 1 = most common, 3 = less common. */
const PROGRESSION_SOURCE = {
  ionian: [
    // Original ids kept so existing practice stats carry over
    { tier: 1, id: 'I_IV_V',    degrees: [0,3,4],   desc: 'Classic blues / rock' },
    { tier: 1, id: 'I_V_vi_IV', degrees: [0,4,5,3], desc: 'Axis — the pop staple' },
    { tier: 1, id: 'ii_V_I',    degrees: [1,4,0],   desc: 'Jazz cadence', sevenths: true },
    { tier: 2, id: 'I_vi_IV_V', degrees: [0,5,3,4], desc: '50s doo-wop' },
    { tier: 2, id: 'vi_IV_I_V', degrees: [5,3,0,4], desc: 'Axis starting on vi' },
    { tier: 2, id: 'I_V_IV',    degrees: [0,4,3],   desc: 'Country / reverse blues' },
    { tier: 3, degrees: [0,3,5,4], desc: 'Pop variant' },
    { tier: 3, degrees: [0,5,1,4], desc: 'Turnaround' },
    { tier: 3, degrees: [0,2,3,4], desc: 'Stepwise climb' },
    { tier: 3, degrees: [3,4,2,5], desc: 'Royal Road (J-pop)' },
    { tier: 3, degrees: [0,4,5,2], desc: 'Pachelbel\'s Canon (opening)' },
    { tier: 3, degrees: [0,3,1,4], desc: 'Gospel / pop turnaround' },
    { tier: 3, degrees: [5,1,4,0], desc: 'Circle of fifths' },
    { tier: 3, degrees: [3,0,4,5], desc: 'Axis starting on IV' },
  ],
  aeolian: [
    { tier: 1, degrees: [0,5,2,6], desc: 'Minor axis' },
    { tier: 1, degrees: [0,3,4],   desc: 'Natural minor cadence' },
    { tier: 1, degrees: [0,6,5],   desc: 'Descending rock line' },
    { tier: 2, degrees: [0,5,6,0], desc: 'Epic / cinematic' },
    { tier: 2, degrees: [0,3,6,2], desc: 'Minor circle' },
    { tier: 2, degrees: [0,6,5,6], desc: 'Aeolian vamp' },
    { tier: 3, degrees: [0,2,6,3], desc: 'Minor rock' },
    { tier: 3, degrees: [0,4,5,6], desc: 'Rising minor' },
    { tier: 3, degrees: [1,4,0],   desc: 'Natural-minor ii–v–i' },
    { tier: 3, degrees: [0,5,3,4], desc: 'Minor ballad' },
  ],
  dorian: [
    { tier: 1, degrees: [0,3],     desc: 'The Dorian vamp' },
    { tier: 1, degrees: [0,6,3],   desc: 'Dorian rock' },
    { tier: 1, degrees: [0,3,6,0], desc: 'Dorian cadence' },
    { tier: 2, degrees: [0,1,2,3], desc: 'Stepwise Dorian climb' },
    { tier: 2, degrees: [0,2,3],   desc: 'Funk lift' },
    { tier: 2, degrees: [0,4,3],   desc: 'Dorian blues' },
    { tier: 3, degrees: [0,6,2,3], desc: 'Modal rock loop' },
    { tier: 3, degrees: [0,3,4,0], desc: 'Dorian with minor v' },
  ],
  phrygian: [
    { tier: 1, degrees: [0,1],     desc: 'Phrygian vamp (flamenco / metal)' },
    { tier: 1, degrees: [0,1,2,1], desc: 'Phrygian climb' },
    { tier: 1, degrees: [0,1,0,6], desc: 'Phrygian with bvii' },
    { tier: 2, degrees: [0,6,5,1], desc: 'Descending Phrygian' },
    { tier: 2, degrees: [0,3,1,0], desc: 'Phrygian cadence' },
    { tier: 2, degrees: [0,2,1],   desc: 'bIII to bII' },
    { tier: 3, degrees: [0,5,1,0], desc: 'Dark cinematic' },
    { tier: 3, degrees: [0,1,3],   desc: 'bII to iv' },
  ],
  lydian: [
    { tier: 1, degrees: [0,1],     desc: 'Lydian shimmer' },
    { tier: 1, degrees: [0,1,0,6], desc: 'Lydian vamp' },
    { tier: 1, degrees: [0,1,4],   desc: 'Lydian lift' },
    { tier: 2, degrees: [0,1,2],   desc: 'Stepwise Lydian' },
    { tier: 2, degrees: [0,6,1,0], desc: 'Film-score loop' },
    { tier: 2, degrees: [0,4,1,0], desc: 'Bright return' },
    { tier: 3, degrees: [0,5,1,0], desc: 'Dreamy turnaround' },
    { tier: 3, degrees: [0,2,1,0], desc: 'iii to II' },
  ],
  mixolydian: [
    { tier: 1, degrees: [0,6,3,0], desc: 'Classic rock cadence' },
    { tier: 1, degrees: [0,6],     desc: 'Mixolydian vamp' },
    { tier: 1, degrees: [6,3,0],   desc: 'Double plagal cadence' },
    { tier: 2, degrees: [0,4,3,0], desc: 'Minor v to IV' },
    { tier: 2, degrees: [0,3,6],   desc: 'Rising to bVII' },
    { tier: 2, degrees: [0,6,4],   desc: 'bVII to v' },
    { tier: 3, degrees: [0,1,6,0], desc: 'ii to bVII' },
    { tier: 3, degrees: [0,4,6,3], desc: 'Modal rock loop' },
    { tier: 3, degrees: [0,5,6,0], desc: 'vi to bVII' },
  ],
  locrian: [
    { tier: 1, degrees: [0,1],     desc: 'Locrian vamp' },
    { tier: 1, degrees: [0,6],     desc: 'Diminished to bvii' },
    { tier: 1, degrees: [0,1,6,0], desc: 'Locrian loop' },
    { tier: 2, degrees: [0,4,1,0], desc: 'bV to bII' },
    { tier: 2, degrees: [0,2,1],   desc: 'biii to bII' },
    { tier: 3, degrees: [0,5,1,0], desc: 'bVI to bII' },
    { tier: 3, degrees: [0,3,1],   desc: 'iv to bII' },
  ],
};

const PROGRESSION_LIBRARY = Object.entries(PROGRESSION_SOURCE).flatMap(([mode, list]) =>
  list.map(p => ({
    id:       p.id || `${mode}:${p.degrees.join('')}${p.sevenths ? '7' : ''}`,
    mode,
    tier:     p.tier,
    degrees:  p.degrees,
    sevenths: !!p.sevenths,
    name:     progressionName(mode, p.degrees, p.sevenths),
    desc:     p.desc,
  }))
);

/* ── Progression difficulty levels ──
   1–3: named progressions up to that tier
   4:   any 4-chord diatonic progression starting on the tonic
   5:   any 4-chord diatonic progression */
const PROGRESSION_LEVEL_COUNT = 5;

function namedProgressions(mode, maxTier) {
  return PROGRESSION_LIBRARY.filter(p => p.mode === mode && p.tier <= maxTier);
}

/** Random 4-chord progression with no chord repeated back-to-back. */
function randomProgressionDegrees(startOnTonic) {
  const d = [startOnTonic ? 0 : randInt(0, 6)];
  while (d.length < 4) {
    let n;
    do { n = randInt(0, 6); } while (n === d[d.length - 1]);
    d.push(n);
  }
  return d;
}

/**
 * A near-miss of a progression: change 1–2 chords so the distractor
 * sounds similar. Keeps the tonic start (if required) and avoids
 * back-to-back repeats.
 */
function mutateProgression(degrees, startOnTonic) {
  const out       = [...degrees];
  const positions = shuffle(startOnTonic ? [1, 2, 3] : [0, 1, 2, 3]).slice(0, randFrom([1, 1, 2]));
  positions.forEach(p => {
    const options = [0,1,2,3,4,5,6].filter(n => n !== degrees[p] && n !== out[p - 1] && n !== out[p + 1]);
    out[p] = randFrom(options);
  });
  return out;
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
