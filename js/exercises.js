/* ============================================================
   exercises.js — Exercise Generators
   ============================================================ */

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */
/**
 * Per-session options chosen on the practice setup screen.
 * Falls back to undefined (→ global setting / adaptive) when not set.
 */
function practiceOpt(key) {
  return (typeof state !== 'undefined' && state.practice) ? state.practice[key] : undefined;
}

/** Fixed level from the setup screen, or the adaptive level. */
function pickLevel(type, levelCount) {
  const lv = practiceOpt('level');
  if (Number.isInteger(lv)) return Math.max(0, Math.min(levelCount - 1, lv));
  return adaptive.getLevel(type, levelCount);
}

function getIntervalDirection() {
  try {
    const d = practiceOpt('intervalDirection') || state.settings.intervalDirection || 'ascending';
    if (d === 'mixed') return randFrom(['ascending', 'descending', 'harmonic']);
    return d;
  } catch (e) { return 'ascending'; }
}

function getScaleMode() {
  try {
    const m = practiceOpt('scaleMode') || state.settings.scaleMode || 'ascending';
    if (m === 'mixed') return randFrom(SCALE_PLAY_MODES.filter(x => x.id !== 'mixed')).id;
    return m;
  } catch (e) { return 'ascending'; }
}

/**
 * Pair up notes randomly so every note appears at least once.
 * With an odd count, the leftover note is paired with a random other note.
 */
function randomDiads(notes) {
  const order = shuffle(notes);
  const pairs = [];
  for (let i = 0; i < order.length; i += 2) {
    if (i + 1 < order.length) {
      pairs.push([order[i], order[i + 1]]);
    } else {
      const partner = randFrom(notes.filter(n => n !== order[i]));
      pairs.push([order[i], partner]);
    }
  }
  return pairs.map(p => p.sort((a, b) => a - b));
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
  const level    = pickLevel('interval', INTERVAL_LEVELS.length);
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
  const refText  = dir === 'ascending'  ? `Reference (up): "${correct.ref}"`
                 : dir === 'descending' ? `Reference (down): "${correct.refDown}"`
                 : `Up: "${correct.ref}" · Down: "${correct.refDown}"`;
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
    explain: `${correct.name} (${correct.abbr}) — ${correct.semitones} semitone${correct.semitones !== 1 ? 's' : ''}. ${refText}`,
  };
}

/* ─────────────────────────────────────────
   Chord Exercise
   ───────────────────────────────────────── */
function generateChordExercise() {
  const level    = pickLevel('chord', CHORD_LEVELS.length);
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
  const level    = pickLevel('scale', SCALE_LEVELS.length);
  const ids      = SCALE_LEVELS[level];
  const pool     = ids.map(id => SCALE_TYPES.find(s => s.id === id));
  const correct  = randFrom(pool);
  const rootMidi = randInt(48, 56);
  const notes    = correct.intervals.map(s => rootMidi + s);
  const speed    = getSpeedMult();
  const mode     = getScaleMode();

  const choices      = generateChoices(correct, pool, 4, x => x.id);
  const correctIndex = choices.findIndex(c => c.id === correct.id);
  const skillKey     = `scale_${correct.id}`;

  // Unique pitches (drop the top octave, which duplicates the root)
  const unique = notes.filter(n => n !== rootMidi + 12);

  // Decide the random orderings once so replay sounds identical
  const shuffledRest = shuffle(unique.filter(n => n !== rootMidi));
  const diads        = randomDiads(unique);

  const spacing = 0.22 * speed;
  const dur     = 0.6  * speed;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;

    switch (mode) {
      case 'descending':
        audio.playSequence([...notes].reverse(), t, spacing, dur);
        break;
      case 'updown':
        audio.playSequence([...notes, ...notes.slice(0, -1).reverse()], t, spacing, dur);
        break;
      case 'random': {
        // Tonic first (held a little longer) so the mode is identifiable
        audio.playNote(rootMidi, t, 0.9 * speed, 0.5);
        audio.playSequence(shuffledRest, t + 0.8 * speed, 0.34 * speed, dur);
        break;
      }
      case 'diads': {
        audio.playNote(rootMidi, t, 0.9 * speed, 0.5);
        const gap = 0.85 * speed;
        diads.forEach((pair, i) => {
          audio.playChord(pair, t + 1.0 * speed + i * gap, 0.75 * speed, 0.38);
        });
        break;
      }
      default: // ascending
        audio.playSequence(notes, t, spacing, dur);
    }
    highlightKeys(notes);
  };

  const modeLabel = SCALE_PLAY_MODES.find(m => m.id === mode).label;

  return {
    type: 'scale',
    skillKey,
    question: 'What scale or mode is this?',
    keyLabel: `Root: ${midiToName(rootMidi)} · ${modeLabel}`,
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
  const level      = pickLevel('functional', FUNCTIONAL_LEVELS.length);
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
  const level       = pickLevel('pitch', PERFECT_PITCH_LEVELS.length);
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
   Chord Progression Exercise
   Major key with borrowed chords. Chord 1 is always I; the user names
   each following chord individually.
   ───────────────────────────────────────── */
function progressionPalette() {
  const custom = practiceOpt('chords');
  if (Array.isArray(custom) && custom.length >= 2) return sortProgChords(custom);
  return PROG_PALETTES[pickLevel('progression', PROG_PALETTES.length)];
}

function generateProgressionExercise() {
  const palette   = progressionPalette();
  const length    = practiceOpt('progressionLength') || 4;
  const chords    = randomProgression(palette, length);
  const tonicMidi = randInt(50, 57); // D3–A3
  const speed     = getSpeedMult();
  const voicings  = chords.map(id => progChordNotes(id, tonicMidi));

  const chordDur = 0.8 * speed;
  const chordGap = 1.0 * speed;

  const playFn = async () => {
    await audio.resume();
    const t = audio.now() + 0.05;
    voicings.forEach((notes, i) => audio.playChord(notes, t + i * chordGap, chordDur, 0.32));
    highlightKeys(voicings[0]);
  };

  // Explain any borrowed / colour chords that appeared
  const borrowed = [...new Set(chords)]
    .map(id => PROG_CHORD_BY_ID[id])
    .filter(c => c.from)
    .map(c => `${c.label} from ${c.from}`);

  const keyName = midiToName(tonicMidi, true).replace(/\d+$/, '');

  return {
    type: 'progression',
    kind: 'multi',
    skillKey: 'progression_overall',
    question: 'Name each chord',
    keyLabel: `Key: ${keyName} major`,
    play:  playFn,
    replay: playFn,
    options: palette.map(id => ({ value: id, label: PROG_CHORD_BY_ID[id].label })),
    slots: chords.slice(1).map((id, i) => ({ label: `Chord ${i + 2}`, correct: id })),
    givenFirst: 'I',
    notes: voicings[0],
    explain: progressionLabel(chords) + (borrowed.length ? ` · Borrowed: ${borrowed.join(', ')}` : ''),
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
