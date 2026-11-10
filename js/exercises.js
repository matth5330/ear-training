/* ============================================================
   exercises.js — Exercise Generators
   ============================================================ */

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */
function getIntervalDirection() {
  try {
    const d = (typeof state !== 'undefined' && state.settings)
      ? state.settings.intervalDirection || 'ascending'
      : 'ascending';
    if (d === 'mixed') return randFrom(['ascending', 'descending', 'harmonic']);
    return d;
  } catch (e) { return 'ascending'; }
}

function isFixedRoot() {
  try {
    return !!(typeof state !== 'undefined' && state.settings && state.settings.fixedRoot);
  } catch (e) { return false; }
}

/* ─────────────────────────────────────────
   Interval Exercise
   ───────────────────────────────────────── */
function generateIntervalExercise() {
  const level    = adaptive.getLevel('interval', INTERVAL_LEVELS.length);
  const pool     = INTERVAL_LEVELS[level].map(s => INTERVALS.find(iv => iv.semitones === s));
  const correct  = randFrom(pool);
  const rootMidi = isFixedRoot() ? 60 : randInt(48, 60);
  const upperMidi = rootMidi + correct.semitones;
  const dir      = getIntervalDirection();
  const speed    = getSpeedMult();

  const choices      = generateChoices(correct, pool, 4, x => x.semitones);
  const correctIndex = choices.findIndex(c => c.semitones === correct.semitones);
  const skillKey     = `interval_${correct.abbr}`;

  const spacing = 0.95 * speed;
  const dur     = 0.8 * speed;

  const playNotes = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    if (dir === 'harmonic') {
      audio.playChord([rootMidi, upperMidi], t, 1.2 * speed, 0.45);
    } else if (dir === 'descending') {
      audio.playNote(upperMidi, t,           dur, 0.55);
      audio.playNote(rootMidi,  t + spacing, dur, 0.55);
    } else {
      audio.playNote(rootMidi,  t,           dur, 0.55);
      audio.playNote(upperMidi, t + spacing, dur, 0.55);
    }
    highlightKeys([rootMidi, upperMidi]);
  };

  const dirLabel = dir.charAt(0).toUpperCase() + dir.slice(1);
  const questionText = dir === 'harmonic'
    ? 'What harmonic interval is this?'
    : `What interval is this? (${dir})`;

  return {
    type: 'interval',
    skillKey,
    question: questionText,
    keyLabel: `Root: ${midiToName(rootMidi)} · ${dirLabel}`,
    play:  playNotes,
    replay: playNotes,
    choices: choices.map(c => ({ label: c.name, value: c.semitones })),
    correctIndex,
    notes: [rootMidi, upperMidi],
    explain: `${correct.name} (${correct.abbr}) — ${correct.semitones} semitone${correct.semitones !== 1 ? 's' : ''}. Reference: "${correct.ref}"`,
  };
}

/* ─────────────────────────────────────────
   Chord Exercise
   ───────────────────────────────────────── */
function generateChordExercise() {
  const level    = adaptive.getLevel('chord', CHORD_LEVELS.length);
  const ids      = CHORD_LEVELS[level];
  const pool     = ids.map(id => CHORD_TYPES.find(c => c.id === id));
  const correct  = randFrom(pool);
  const rootMidi = randInt(48, 60);
  const notes    = correct.intervals.map(s => rootMidi + s);
  const speed    = getSpeedMult();

  const choices      = generateChoices(correct, pool, 4, x => x.id);
  const correctIndex = choices.findIndex(c => c.id === correct.id);
  const skillKey     = `chord_${correct.id}`;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    audio.playArpeggio(notes, t, 0.18 * speed, 1.0 * speed, 0.5);
    highlightKeys(notes);
  };

  return {
    type: 'chord',
    skillKey,
    question: 'What type of chord is this?',
    keyLabel: `Root: ${midiToName(rootMidi)}`,
    play:  playFn,
    replay: playFn,
    choices: choices.map(c => ({ label: c.name, value: c.id })),
    correctIndex,
    notes,
    explain: `${correct.name} chord — ${correct.character}`,
  };
}

/* ─────────────────────────────────────────
   Scale Exercise
   ───────────────────────────────────────── */
function generateScaleExercise() {
  const level    = adaptive.getLevel('scale', SCALE_LEVELS.length);
  const ids      = SCALE_LEVELS[level];
  const pool     = ids.map(id => SCALE_TYPES.find(s => s.id === id));
  const correct  = randFrom(pool);
  const rootMidi = randInt(48, 56);
  const notes    = correct.intervals.map(s => rootMidi + s);
  const speed    = getSpeedMult();

  const choices      = generateChoices(correct, pool, 4, x => x.id);
  const correctIndex = choices.findIndex(c => c.id === correct.id);
  const skillKey     = `scale_${correct.id}`;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    audio.playScale(rootMidi, correct.intervals, t, true, speed);
    highlightKeys(notes);
  };

  return {
    type: 'scale',
    skillKey,
    question: 'What scale or mode is this?',
    keyLabel: `Root: ${midiToName(rootMidi)}`,
    play:  playFn,
    replay: playFn,
    choices: choices.map(c => ({ label: c.name, value: c.id })),
    correctIndex,
    notes,
    explain: `${correct.name} — ${correct.character}`,
  };
}

/* ─────────────────────────────────────────
   Functional / Scale Degree Exercise
   ───────────────────────────────────────── */
function generateFunctionalExercise() {
  const level      = adaptive.getLevel('functional', FUNCTIONAL_LEVELS.length);
  const degreeNums = FUNCTIONAL_LEVELS[level];
  const pool       = degreeNums.map(n => SCALE_DEGREES.find(d => d.degree === n));
  const correct    = randFrom(pool);
  const rootMidi   = randInt(48, 60);
  const targetMidi = rootMidi + correct.semitone;
  const speed      = getSpeedMult();

  const choices      = generateChoices(correct, pool, 4, x => x.degree);
  const correctIndex = choices.findIndex(c => c.degree === correct.degree);
  const skillKey     = `functional_${correct.degree}`;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    const cadenceEnd = audio.playCadence(rootMidi, t, speed);
    audio.playNote(targetMidi, cadenceEnd + 0.3 * speed, 1.2 * speed, 0.6);
    highlightKeys([targetMidi]);
  };

  const replayFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    const cadenceEnd = audio.playCadence(rootMidi, t, speed);
    audio.playNote(targetMidi, cadenceEnd + 0.3 * speed, 1.2 * speed, 0.6);
    highlightKeys([targetMidi]);
  };

  return {
    type: 'functional',
    skillKey,
    question: 'Which scale degree are you hearing?',
    keyLabel: `Key of ${midiToName(rootMidi)} Major`,
    play:  playFn,
    replay: replayFn,
    choices: choices.map(c => ({ label: `${c.degree} — ${c.solfege} (${c.name})`, value: c.degree })),
    correctIndex,
    notes: [targetMidi],
    explain: `Degree ${correct.degree}: "${correct.solfege}" — ${correct.name}. ${correct.semitone} semitone${correct.semitone !== 1 ? 's' : ''} above the tonic.`,
  };
}

/* ─────────────────────────────────────────
   Perfect Pitch Exercise  (NEW)
   ───────────────────────────────────────── */
function generatePerfectPitchExercise() {
  const level       = adaptive.getLevel('pitch', PERFECT_PITCH_LEVELS.length);
  const notePool    = PERFECT_PITCH_LEVELS[level];
  const correctName = randFrom(notePool);
  const noteIndex   = NOTES_SHARP.indexOf(correctName);
  const octave      = randInt(3, 5);
  const midi        = (octave + 1) * 12 + noteIndex;
  const speed       = getSpeedMult();

  const choices      = generateChoices(correctName, notePool, Math.min(4, notePool.length), x => x);
  const correctIndex = choices.indexOf(correctName);
  const skillKey     = `pitch_${correctName}`;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    audio.playNote(midi, t, 1.5 * speed, 0.55);
    highlightKeys([midi]);
  };

  return {
    type: 'pitch',
    skillKey,
    question: 'What note is this?',
    keyLabel: `Octave ${octave}`,
    play:  playFn,
    replay: playFn,
    choices: choices.map(n => ({ label: n, value: n })),
    correctIndex,
    notes: [midi],
    explain: `${correctName}${octave} (MIDI ${midi})`,
  };
}

/* ─────────────────────────────────────────
   Chord Progression Exercise  (NEW)
   ───────────────────────────────────────── */
function generateProgressionExercise() {
  const level     = adaptive.getLevel('progression', 3);
  const poolCount = level <= 1 ? 3 : level === 2 ? 4 : CHORD_PROGRESSIONS.length;
  const pool      = CHORD_PROGRESSIONS.slice(0, poolCount);
  const correct   = randFrom(pool);
  const rootMidi  = randInt(48, 57); // C3-A3 — keep in comfortable register
  const speed     = getSpeedMult();

  // Build actual MIDI notes for each chord
  const chordNotes = correct.degrees.map((deg, i) => {
    const chordRoot = rootMidi + deg;
    const quality   = correct.qualities[i];
    const ct = CHORD_TYPES.find(c => c.id === quality) || CHORD_TYPES[0];
    return ct.intervals.map(s => chordRoot + s);
  });

  const choices      = generateChoices(correct, pool, Math.min(4, pool.length), x => x.id);
  const correctIndex = choices.findIndex(c => c.id === correct.id);
  const skillKey     = `progression_${correct.id}`;

  const chordDur = 0.75 * speed;
  const chordGap = 0.95 * speed;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    chordNotes.forEach((chord, i) => {
      audio.playChord(chord, t + i * chordGap, chordDur, 0.32);
    });
    // Highlight the tonic notes only
    highlightKeys([rootMidi, rootMidi + 4, rootMidi + 7]);
  };

  return {
    type: 'progression',
    skillKey,
    question: 'Which chord progression is this?',
    keyLabel: `Root: ${midiToName(rootMidi)} major`,
    play:  playFn,
    replay: playFn,
    choices: choices.map(p => ({ label: p.name, value: p.id })),
    correctIndex,
    notes: [rootMidi, rootMidi + 4, rootMidi + 7],
    explain: `${correct.name}: ${correct.description}`,
  };
}

/* ─────────────────────────────────────────
   Dispatcher
   ───────────────────────────────────────── */
function generateExercise(type) {
  switch (type) {
    case 'interval':    return generateIntervalExercise();
    case 'chord':       return generateChordExercise();
    case 'scale':       return generateScaleExercise();
    case 'functional':  return generateFunctionalExercise();
    case 'pitch':       return generatePerfectPitchExercise();
    case 'progression': return generateProgressionExercise();
    default:            return generateIntervalExercise();
  }
}
