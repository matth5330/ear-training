/* ============================================================
   modal-progressions.js — ARCHIVED (not loaded by index.html)

   The earlier progression exercise that analysed progressions from
   inside each mode (e.g. Dorian i–IV, Locrian i°–bII), with a library
   of 64 named modal progressions and generated 4-chord progressions.

   Replaced by the major-key + borrowed-chord (modal interchange)
   exercise in theory.js / exercises.js.

   To bring it back:
     1. Add <script src="js/archive/modal-progressions.js"></script>
        to index.html after exercises.js
     2. In generateExercise() (exercises.js), route 'progression' to
        generateModalProgressionExercise()
     3. Add a 'progressionMode' setting (a MODES id or 'mixed')
   ============================================================ */

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

/* ── Exercise generator ── */
function getProgressionMode() {
  try {
    const m = practiceOpt('progressionMode') || state.settings.progressionMode || 'ionian';
    return m === 'mixed' ? randFrom(MODES).id : m;
  } catch (e) { return 'ionian'; }
}

/**
 * MIDI notes for each chord of a progression. Chords whose root sits high
 * in the scale drop an octave so the progression stays in one register.
 */
function progressionVoicings(mode, degrees, sevenths, tonicMidi) {
  return degrees.map(deg => {
    const ch   = diatonicChord(mode, deg, sevenths);
    const base = tonicMidi + ch.root - (ch.root > 6 ? 12 : 0);
    return ch.intervals.map(i => base + i);
  });
}

/**
 * Pick the correct answer and distractors for a level.
 * Levels 0–2 use the named library; 3–4 generate any 4-chord progression,
 * with distractors that differ from the answer by one or two chords.
 */
function buildProgressionQuestion(level, mode) {
  if (level <= 2) {
    const pool    = namedProgressions(mode, level + 1);
    const correct = randFrom(pool);
    return { correct, choices: generateChoices(correct, pool, Math.min(4, pool.length), x => x.id) };
  }

  const startOnTonic = level === 3;
  const make = degrees => ({
    id: `${mode}:${degrees.join('')}`, mode, degrees, sevenths: false,
    name: progressionName(mode, degrees), desc: null,
  });
  const correct = make(randomProgressionDegrees(startOnTonic));
  const seen    = new Set([correct.id]);
  const others  = [];
  for (let tries = 0; others.length < 3 && tries < 100; tries++) {
    const p = make(mutateProgression(correct.degrees, startOnTonic));
    if (!seen.has(p.id)) { seen.add(p.id); others.push(p); }
  }
  return { correct, choices: shuffle([correct, ...others]) };
}

function generateModalProgressionExercise() {
  const level    = pickLevel('progression', PROGRESSION_LEVEL_COUNT);
  const mode     = getProgressionMode();
  const modeInfo = MODES.find(m => m.id === mode);
  const { correct, choices } = buildProgressionQuestion(level, mode);

  const tonicMidi = randInt(50, 57); // D3–A3: keeps every chord in a comfortable register
  const speed     = getSpeedMult();
  const chords    = progressionVoicings(mode, correct.degrees, correct.sevenths, tonicMidi);
  const tonic     = progressionVoicings(mode, [0], false, tonicMidi)[0];

  const correctIndex = choices.findIndex(c => c.id === correct.id);
  // Named progressions track individually; generated ones track per mode
  const skillKey = correct.desc ? `progression_${correct.id}` : `progression_any_${mode}`;

  const chordDur = 0.75 * speed;
  const chordGap = 0.95 * speed;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    // Tonic chord first to set the key, then a pause, then the progression
    audio.playChord(tonic, t, 0.7 * speed, 0.24);
    const start = t + 1.4 * speed;
    chords.forEach((chord, i) => audio.playChord(chord, start + i * chordGap, chordDur, 0.32));
    highlightKeys(tonic);
  };

  const keyName = midiToName(tonicMidi, true).replace(/\d+$/, '');

  return {
    type: 'progression',
    skillKey,
    question: 'Which chord progression is this?',
    keyLabel: `Key: ${keyName} ${modeInfo.name} · tonic chord first`,
    play:  playFn,
    replay: playFn,
    choices: choices.map(p => ({ label: p.name, value: p.id })),
    correctIndex,
    notes: tonic,
    explain: correct.desc
      ? `${correct.name} — ${correct.desc} (${modeInfo.name})`
      : `${correct.name} in ${keyName} ${modeInfo.name}`,
  };
}

