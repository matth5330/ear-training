/* ============================================================
   app.js — Main Application Logic
   ============================================================ */

/* ── App State ── */
const STATE_KEY = 'eartrain_state';

function defaultState() {
  return {
    streak: 0,
    lastPracticeDate: null,
    xp: 0,
    totalSessions: 0,
    sessionLength: 15,

    // Lifetime stats (used by achievements)
    stats: {
      totalAnswered:   0,
      totalCorrect:    0,
      bestCombo:       0,
      perfectSessions: 0,
      fastCorrect:     0,
    },
    achievements: {},    // { achievementId: unlockedTimestamp }

    // Session
    sessionPlan: [],
    sessionIndex: 0,
    sessionCorrect: 0,
    sessionXp: 0,
    sessionStats: {},    // { type: { correct, total } }
    combo: 0,            // consecutive correct answers
    sessionEndless: false,
    sessionTypes: [],    // types to draw from when endless mode extends the plan
    practice: {},        // per-session overrides from the setup screen (level, scaleMode, …)

    // Current exercise
    exercise: null,
    answered: false,
    startTime: null,
    advanceTimer: null,
    autoPlayTimer: null,

    // UI
    currentTab: 'home',

    // Settings
    settings: {
      intervalDirection: 'ascending', // 'ascending'|'descending'|'harmonic'|'mixed'
      fixedRoot:         false,        // always use C4 as root for intervals
      playbackSpeed:     'normal',     // 'fast'|'normal'|'slow'
      autoProceed:       false,        // advance immediately on correct answer
      endlessMode:       false,        // never-ending session (daily workout)
      scaleMode:         'ascending',  // see SCALE_PLAY_MODES
      practiceSetup:     {},           // last-used setup per exercise type
    },
  };
}

let state = defaultState();

// Keys that get written to localStorage / backup files
const PERSIST_KEYS = ['streak', 'lastPracticeDate', 'xp', 'totalSessions', 'sessionLength', 'stats', 'achievements', 'settings'];

/* ── All exercise types ── */
const ALL_TYPES = ['interval', 'chord', 'scale', 'functional', 'pitch', 'progression'];
const TYPE_LABELS = {
  interval:    'Interval',
  chord:       'Chord Quality',
  scale:       'Scale / Mode',
  functional:  'Scale Degree',
  pitch:       'Perfect Pitch',
  progression: 'Progression',
};
const TYPE_NAMES = {
  interval:    'Intervals',
  chord:       'Chords',
  scale:       'Scales',
  functional:  'Functional',
  pitch:       'Perfect Pitch',
  progression: 'Progressions',
};

/* ── Persistence ── */
function applySavedState(saved) {
  if (!saved || typeof saved !== 'object') return;
  PERSIST_KEYS.forEach(key => {
    if (!(key in saved)) return;
    const val = saved[key];
    if (['stats', 'settings', 'achievements'].includes(key)) {
      if (val && typeof val === 'object') state[key] = Object.assign(state[key], val);
    } else {
      state[key] = val;
    }
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) applySavedState(JSON.parse(raw));
  } catch (e) { /* use defaults */ }
}

function persistableState() {
  const out = {};
  PERSIST_KEYS.forEach(k => { out[k] = state[k]; });
  return out;
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(persistableState()));
  } catch (e) { console.warn('saveState failed', e); }
}

/* ── Streak Logic ── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak() {
  const today = todayStr();
  if (state.lastPracticeDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  if (state.lastPracticeDate === yStr) {
    state.streak += 1;
  } else {
    state.streak = 1;
  }

  state.lastPracticeDate = today;
  saveState();
  updateHeaderUI();
}

/* ── Header UI ── */
function updateHeaderUI() {
  const streakEl = document.getElementById('streak-count');
  const xpEl     = document.getElementById('xp-count');
  if (streakEl) streakEl.textContent = state.streak;
  if (xpEl)     xpEl.textContent     = state.xp;
}

/* ── Tab Switching ── */
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const tabEl  = document.getElementById('tab-' + tabId);
  const navBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);

  if (tabEl)  tabEl.classList.add('active');
  if (navBtn) navBtn.classList.add('active');

  state.currentTab = tabId;
  audio.stopAll(); // e.g. leaving the Learn tab mid-example

  switch (tabId) {
    case 'home':     renderHomeTab();     break;
    case 'train':    renderTrainTab();    break;
    case 'progress': renderProgressTab(); break;
    case 'learn':    renderLearnTab();    break;
    case 'settings': renderSettingsTab(); break;
  }
}

/* ══════════════════════════════════════════
   TAB RENDERERS
   ══════════════════════════════════════════ */

/* ── Home Tab ── */
function renderHomeTab() {
  document.getElementById('home-streak').textContent   = state.streak;
  document.getElementById('home-xp').textContent       = state.xp;
  document.getElementById('home-sessions').textContent = state.totalSessions;

  const container = document.getElementById('weak-areas-list');
  const weak = ALL_TYPES.map(t => ({ type: t, name: TYPE_NAMES[t], acc: adaptive.getAccuracy(t) }))
    .filter(w => w.acc !== null && w.acc < 80)
    .sort((a, b) => a.acc - b.acc);

  container.innerHTML = weak.length === 0
    ? '<p class="muted-text">No weak areas — keep it up!</p>'
    : weak.map(w => `
        <div class="weak-item">
          <span class="weak-item-name">${w.name}</span>
          <span class="weak-item-acc">${w.acc}% accuracy</span>
        </div>`).join('');
}

/* ── Train Tab ── */
function renderTrainTab() {
  const categories = [
    { type: 'interval',    icon: '↕', title: 'Intervals',      desc: 'Identify distance between two notes' },
    { type: 'chord',       icon: '♪', title: 'Chords',         desc: 'Recognize chord qualities and types' },
    { type: 'scale',       icon: '♫', title: 'Scales',         desc: 'Identify major, minor, and modal scales' },
    { type: 'functional',  icon: '♬', title: 'Scale Degrees',  desc: 'Hear scale degrees in tonal context' },
    { type: 'pitch',       icon: '◎', title: 'Perfect Pitch',  desc: 'Identify individual note names' },
    { type: 'progression', icon: '▶', title: 'Progressions',   desc: 'Identify common chord progressions' },
  ];
  const html = categories.map(cat => {
    const acc   = adaptive.getAccuracy(cat.type);
    const level = adaptive.getLevel(cat.type, levelsFor(cat.type).length);
    const accText  = acc !== null ? `${acc}% accuracy` : 'No data';
    const accClass = acc === null ? '' : acc >= 75 ? 'good' : 'warn';
    return `
      <div class="train-card">
        <div class="train-card-icon">${cat.icon}</div>
        <div class="train-card-body">
          <div class="train-card-title">${cat.title}</div>
          <div class="train-card-sub">${cat.desc}</div>
          <div class="train-card-meta">
            <span class="meta-pill">Level ${level + 1}</span>
            <span class="meta-pill ${accClass}">${accText}</span>
          </div>
        </div>
        <button class="train-card-btn" onclick="openPracticeSetup('${cat.type}')">Practice</button>
      </div>`;
  }).join('');

  document.getElementById('train-cards').innerHTML = html;
}

/* ── Progress Tab ── */
function renderProgressTab() {
  const container = document.getElementById('accuracy-bars');
  container.innerHTML = ALL_TYPES.map(t => {
    const acc = adaptive.getAccuracy(t);
    const pct = acc !== null ? acc : 0;
    return `
      <div class="acc-row">
        <div class="acc-label">
          <span class="acc-label-name">${TYPE_NAMES[t]}</span>
          <span class="acc-label-val">${acc !== null ? acc + '%' : 'No data'}</span>
        </div>
        <div class="acc-bar-bg">
          <div class="acc-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');

  const canvas = document.getElementById('radar-chart');
  if (canvas) drawRadarChart(canvas);

  renderAchievements();
}

function renderAchievements() {
  const grid  = document.getElementById('achievements-grid');
  const count = document.getElementById('achievements-count');
  if (!grid) return;

  const unlockedCount = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
  if (count) count.textContent = `${unlockedCount} / ${ACHIEVEMENTS.length}`;

  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const when = state.achievements[a.id];
    const sub  = when ? `Unlocked ${new Date(when).toLocaleDateString()}` : a.desc;
    return `
      <div class="badge ${when ? 'unlocked' : 'locked'}" title="${a.desc}">
        <div class="badge-icon">${a.icon}</div>
        <div class="badge-name">${a.name}</div>
        <div class="badge-desc">${sub}</div>
      </div>`;
  }).join('');
}

/* ── Learn Tab ── */
const PLAY_ICON = '<span class="learn-play-icon" aria-hidden="true">&#9654;</span>';

function renderLearnTab() {
  const tbody = document.querySelector('#interval-table tbody');
  if (tbody) {
    tbody.innerHTML = INTERVALS.slice(1).map(iv => `
      <tr class="playable" data-play="interval" data-id="${iv.semitones}" tabindex="0">
        <td>${PLAY_ICON}<strong>${iv.name}</strong> (${iv.abbr})</td>
        <td>${iv.semitones}</td>
        <td>${iv.ref}</td>
        <td>${iv.refDown}</td>
      </tr>`).join('');
  }

  const card = (kind, id, title, sub) => `
    <div class="learn-mini-card playable" data-play="${kind}" data-id="${id}" tabindex="0">
      <div class="learn-mini-title">${PLAY_ICON}${title}</div>
      <div class="learn-mini-sub">${sub}</div>
    </div>`;

  const chordContainer = document.getElementById('chord-cards');
  if (chordContainer) {
    chordContainer.innerHTML = CHORD_TYPES.map(c => card('chord', c.id, `${c.name} (${c.abbr})`, c.character)).join('');
  }

  const scaleContainer = document.getElementById('scale-cards');
  if (scaleContainer) {
    scaleContainer.innerHTML = SCALE_TYPES.map(s => card('scale', s.id, s.name, s.character)).join('');
  }

  const progContainer = document.getElementById('prog-cards');
  if (progContainer) {
    progContainer.innerHTML = LEARN_PROGRESSIONS.map(p => card('progression', p.id, p.name, p.desc)).join('');
  }

  const borrowedContainer = document.getElementById('borrowed-cards');
  if (borrowedContainer) {
    borrowedContainer.innerHTML = PROG_CHORDS
      .filter(c => c.group !== 'diatonic')
      .map(c => card('borrowed', c.id, c.label, c.from ? `${c.desc} · from ${c.from}` : c.desc))
      .join('');
  }
}

/**
 * Play a Learn-tab example, rooted on C.
 * Returns the duration in seconds so the caller can show a "playing" state.
 */
function playLearnExample(kind, id) {
  const sp   = getSpeedMult();
  const t    = audio.now() + 0.05;
  const root = 60; // C4

  switch (kind) {
    case 'interval': {
      const semis = parseInt(id, 10);
      // Up, then down, then together
      audio.playNote(root,         t,             0.8 * sp, 0.5);
      audio.playNote(root + semis, t + 0.65 * sp, 0.8 * sp, 0.5);
      audio.playNote(root + semis, t + 1.6 * sp,  0.8 * sp, 0.5);
      audio.playNote(root,         t + 2.25 * sp, 0.8 * sp, 0.5);
      audio.playChord([root, root + semis], t + 3.2 * sp, 1.2 * sp, 0.35);
      return 4.5 * sp;
    }
    case 'chord': {
      const chord = CHORD_TYPES.find(c => c.id === id);
      if (!chord) return 0;
      const notes   = chord.intervals.map(i => root + i);
      const spacing = 0.18 * sp;
      const blockAt = t + notes.length * spacing + 0.4 * sp;
      audio.playArpeggio(notes, t, spacing, 1.0 * sp, 0.4);
      audio.playChord(notes, blockAt, 1.5 * sp, 0.3);
      return (blockAt - t) + 1.5 * sp;
    }
    case 'scale': {
      const scale = SCALE_TYPES.find(s => s.id === id);
      if (!scale) return 0;
      return audio.playScale(root, scale.intervals, t, true, sp) - t;
    }
    case 'progression':
    case 'borrowed': {
      // Heard in context: I → chord → I, or I → chord → its target → I for applied chords
      const ch  = PROG_CHORD_BY_ID[id];
      const ids = kind === 'borrowed'
        ? (ch ? (ch.target ? ['I', id, ch.target, 'I'] : ['I', id, 'I']) : null)
        : (LEARN_PROGRESSIONS.find(p => p.id === id) || {}).chords;
      if (!ids) return 0;
      const gap = 0.9 * sp;
      ids.forEach((cid, i) => audio.playChord(progChordNotes(cid, 60), t + i * gap, 0.85 * sp, 0.28));
      return ids.length * gap + 0.85 * sp;
    }
  }
  return 0;
}

function handleLearnPlay(el) {
  audio.resume().then(() => {
    audio.stopAll(); // one example at a time
    document.querySelectorAll('.playable.playing').forEach(p => p.classList.remove('playing'));
    const secs = playLearnExample(el.dataset.play, el.dataset.id);
    el.classList.add('playing');
    clearTimeout(el._playTimer);
    el._playTimer = setTimeout(() => el.classList.remove('playing'), secs * 1000);
  });
}

/* ── Settings Tab ── */
function renderSettingsTab() {
  const sel = document.getElementById('session-length-select');
  if (sel) sel.value = String(state.sessionLength);

  const volSlider = document.getElementById('volume-slider');
  if (volSlider) volSlider.value = String(Math.round(audio.volume * 100));

  const dirSel = document.getElementById('interval-dir-select');
  if (dirSel) dirSel.value = state.settings.intervalDirection;

  const speedSel = document.getElementById('playback-speed-select');
  if (speedSel) speedSel.value = state.settings.playbackSpeed;

  const scaleSel = document.getElementById('scale-mode-select');
  if (scaleSel) scaleSel.value = state.settings.scaleMode;

  const fixedRootChk = document.getElementById('fixed-root-toggle');
  if (fixedRootChk) fixedRootChk.checked = state.settings.fixedRoot;

  const autoProceedChk = document.getElementById('auto-proceed-toggle');
  if (autoProceedChk) autoProceedChk.checked = state.settings.autoProceed;

  const endlessChk = document.getElementById('endless-mode-toggle');
  if (endlessChk) endlessChk.checked = state.settings.endlessMode;
}

/* ══════════════════════════════════════════
   SESSION MANAGEMENT
   ══════════════════════════════════════════ */

// Re-runs the last session type for the "Keep Going" button
let lastLaunch = () => startDailyWorkout();

function startDailyWorkout() {
  const total = state.sessionLength;
  const plan  = adaptive.generateSessionPlan(total, ALL_TYPES);
  openExerciseModal(plan, { endless: state.settings.endlessMode, types: ALL_TYPES, practice: {} });
  lastLaunch = startDailyWorkout;
}

/**
 * Start a single-category session. Uses the given setup, or the last
 * setup the user chose for this type (Home → Quick Practice skips the
 * setup screen and lands here directly).
 */
function startCategoryPractice(type, setup = getPracticeSetup(type)) {
  const endless = setup.length === 'endless';
  const count   = endless ? state.sessionLength : setup.length;
  const plan    = Array.from({ length: count }, () => ({ type }));
  openExerciseModal(plan, {
    endless,
    types: [type],
    practice: {
      level:             Number.isInteger(setup.level) ? setup.level : undefined,
      chords:            setup.level === 'custom' ? setup.chords : undefined,
      intervalDirection: setup.intervalDirection,
      scaleMode:         setup.scaleMode,
      progressionLength: setup.progressionLength,
    },
  });
  lastLaunch = () => startCategoryPractice(type, setup);
}

function openExerciseModal(plan, opts) {
  audio.init();
  audio.stopAll();
  state.sessionPlan    = plan;
  state.sessionIndex   = 0;
  state.sessionCorrect = 0;
  state.sessionXp      = 0;
  state.sessionStats   = {};
  state.combo          = 0;
  state.sessionEndless = !!opts.endless;
  state.sessionTypes   = opts.types;
  state.practice       = opts.practice || {};

  document.getElementById('modal-xp').textContent = '+0 XP';

  // Show/hide stop button based on endless mode
  const stopBtn = document.getElementById('btn-stop-endless');
  if (stopBtn) stopBtn.style.display = state.sessionEndless ? 'flex' : 'none';

  document.getElementById('exercise-modal').classList.remove('hidden');
  showNextExercise();
}

/** Cancel everything tied to the running exercise: timers and sound. */
function haltExercise() {
  clearTimeout(state.advanceTimer);
  clearTimeout(state.autoPlayTimer);
  audio.stopAll();
  document.getElementById('btn-play').classList.remove('playing');
}

function isExerciseOpen() {
  return !document.getElementById('exercise-modal').classList.contains('hidden');
}

function closeExerciseModal() {
  haltExercise();
  document.getElementById('exercise-modal').classList.add('hidden');
  state.exercise = null;
}

function closeSessionModal() {
  document.getElementById('session-modal').classList.add('hidden');
  renderHomeTab();
}

function continueSession() {
  document.getElementById('session-modal').classList.add('hidden');
  lastLaunch();
}

/* ══════════════════════════════════════════
   PRACTICE SETUP SCREEN
   ══════════════════════════════════════════ */

/** What each difficulty level contains, as display labels. */
function levelsFor(type, opts = {}) {
  switch (type) {
    case 'interval':    return INTERVAL_LEVELS.map(l => l.map(s => INTERVALS.find(i => i.semitones === s).abbr));
    case 'chord':       return CHORD_LEVELS.map(l => l.map(id => CHORD_TYPES.find(c => c.id === id).abbr));
    case 'scale':       return SCALE_LEVELS.map(l => l.map(id => SCALE_TYPES.find(s => s.id === id).name));
    case 'functional':  return FUNCTIONAL_LEVELS.map(l => l.map(d => SCALE_DEGREES.find(x => x.degree === d).solfege));
    case 'pitch':       return PERFECT_PITCH_LEVELS;
    case 'progression': return PROG_PALETTES.map(p => p.map(id => PROG_CHORD_BY_ID[id].label));
  }
  return [[]];
}

function getPracticeSetup(type) {
  const base = { length: state.sessionLength, level: 'auto' };
  if (type === 'interval')    base.intervalDirection = state.settings.intervalDirection;
  if (type === 'scale')       base.scaleMode         = state.settings.scaleMode;
  if (type === 'progression') base.progressionLength = 4;
  const saved = (state.settings.practiceSetup || {})[type] || {};
  const setup = Object.assign(base, saved);
  delete setup.progressionMode; // from the archived modal version

  // Guard against a level that no longer exists
  const customOk = type === 'progression' && setup.level === 'custom'
    && Array.isArray(setup.chords) && setup.chords.filter(id => PROG_CHORD_BY_ID[id]).length >= 2;
  if (setup.level !== 'auto' && !customOk && !(setup.level >= 0 && setup.level < levelsFor(type).length)) setup.level = 'auto';
  if (customOk) setup.chords = setup.chords.filter(id => PROG_CHORD_BY_ID[id]);
  return setup;
}

/** Chord ids currently selected on the progression setup screen. */
function setupPalette(d) {
  if (d.level === 'custom') return d.chords;
  const lv = d.level === 'auto' ? adaptive.getLevel('progression', PROG_PALETTES.length) : d.level;
  return PROG_PALETTES[lv];
}

function toggleSetupChord(id) {
  if (id === 'I') return; // chord 1 is always I
  const current = new Set(setupPalette(setupDraft));
  current.has(id) ? current.delete(id) : current.add(id);
  setupDraft.level  = 'custom';
  setupDraft.chords = sortProgChords([...current]);
  renderPracticeSetup();
}

let setupDraft = null;

function openPracticeSetup(type) {
  setupDraft = Object.assign({ type }, getPracticeSetup(type));
  renderPracticeSetup();
  document.getElementById('setup-modal').classList.remove('hidden');
}

function closePracticeSetup() {
  document.getElementById('setup-modal').classList.add('hidden');
  setupDraft = null;
}

function segControl(field, options, current) {
  return `<div class="seg" role="radiogroup" data-field="${field}">${options.map(o => `
    <button type="button" role="radio" aria-checked="${String(o.value) === String(current)}"
      class="seg-btn ${String(o.value) === String(current) ? 'active' : ''}"
      data-value="${o.value}">${o.label}</button>`).join('')}</div>`;
}

function renderPracticeSetup() {
  const d      = setupDraft;
  const isProg = d.type === 'progression';
  const levels = levelsFor(d.type, d);
  const auto   = adaptive.getLevel(d.type, levels.length);
  const shown  = d.level === 'auto' ? auto : d.level;

  const levelNote = d.level === 'auto'   ? `Adjusts to your answers. You're currently on level ${auto + 1}.`
                  : d.level === 'custom' ? `Custom set of ${d.chords.length} chords.`
                  : `Fixed at level ${d.level + 1} of ${levels.length}.`;

  const levelOptions = [{ value: 'auto', label: 'Auto' }, ...levels.map((_, i) => ({ value: i, label: String(i + 1) }))];
  if (isProg) levelOptions.push({ value: 'custom', label: 'Custom' });

  // Progressions: every chord is a toggle; other types show a read-only preview
  let chips;
  if (isProg) {
    const active = new Set(setupPalette(d));
    chips = PROG_CHORDS.map(c => `
      <button type="button" class="chip chip-toggle ${active.has(c.id) ? 'on' : ''} chip-${c.group}"
        data-chord="${c.id}" aria-pressed="${active.has(c.id)}" ${c.id === 'I' ? 'disabled title="Chord 1 is always I"' : ''}>${c.label}</button>`).join('');
  } else {
    chips = levels[shown].map(x => `<span class="chip">${x}</span>`).join('');
  }
  const chipHint = isProg
    ? '<div class="setup-note">Tap chords to build your own set. Dashed outlines are chords from outside the major key.</div>'
    : '';
  const canStart = !isProg || setupPalette(d).length >= 2;

  let extra = '';
  if (d.type === 'interval') {
    extra = `
      <div class="setup-field">
        <div class="setup-label">Direction</div>
        ${segControl('intervalDirection', [
          { value: 'ascending', label: 'Up' }, { value: 'descending', label: 'Down' },
          { value: 'harmonic', label: 'Together' }, { value: 'mixed', label: 'Mixed' },
        ], d.intervalDirection)}
      </div>`;
  }
  if (d.type === 'scale') {
    const modeDesc = SCALE_PLAY_MODES.find(m => m.id === d.scaleMode).desc;
    extra = `
      <div class="setup-field">
        <div class="setup-label">Playback</div>
        ${segControl('scaleMode', SCALE_PLAY_MODES.map(m => ({ value: m.id, label: m.label })), d.scaleMode)}
        <div class="setup-note">${modeDesc}</div>
      </div>`;
  }
  if (isProg) {
    extra = `
      <div class="setup-field">
        <div class="setup-label">Chords per progression</div>
        ${segControl('progressionLength', [3, 4, 5, 6].map(n => ({ value: n, label: String(n) })), d.progressionLength)}
        <div class="setup-note">Chord 1 is always I. You name each of the others.</div>
      </div>`;
  }

  document.getElementById('setup-body').innerHTML = `
    <h2 class="setup-title">${TYPE_NAMES[d.type]}</h2>

    <div class="setup-field">
      <div class="setup-label">Questions</div>
      ${segControl('length', [
        { value: 5, label: '5' }, { value: 10, label: '10' }, { value: 15, label: '15' },
        { value: 20, label: '20' }, { value: 'endless', label: 'Endless' },
      ], d.length)}
    </div>

    <div class="setup-field">
      <div class="setup-label">Difficulty</div>
      ${segControl('level', levelOptions, d.level)}
      <div class="setup-note">${levelNote}</div>
      <div class="setup-chips">${chips}</div>
      ${chipHint}
    </div>

    ${extra}

    <div class="setup-buttons">
      <button class="btn-secondary" onclick="closePracticeSetup()">Cancel</button>
      <button class="btn-primary" id="btn-setup-start" ${canStart ? '' : 'disabled title="Pick at least one chord besides I"'}>Start</button>
    </div>`;
}

const NUMERIC_SETUP_FIELDS = ['length', 'level', 'progressionLength'];

function handleSetupClick(e) {
  if (e.target.id === 'setup-modal') { closePracticeSetup(); return; } // backdrop
  if (e.target.id === 'btn-setup-start') { startFromSetup(); return; }
  if (!setupDraft) return;

  const chip = e.target.closest('.chip-toggle');
  if (chip) { toggleSetupChord(chip.dataset.chord); return; }

  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  const field = btn.closest('.seg').dataset.field;
  const raw   = btn.dataset.value;
  if (field === 'level' && raw === 'custom' && setupDraft.level !== 'custom') {
    setupDraft.chords = [...setupPalette(setupDraft)]; // start from what's shown
  }
  setupDraft[field] = NUMERIC_SETUP_FIELDS.includes(field) && /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;
  renderPracticeSetup();
}

function startFromSetup() {
  if (!setupDraft) return;
  if (setupDraft.type === 'progression' && setupPalette(setupDraft).length < 2) return;
  const { type, ...setup } = setupDraft;
  state.settings.practiceSetup = state.settings.practiceSetup || {};
  state.settings.practiceSetup[type] = setup;
  saveState();
  closePracticeSetup();
  startCategoryPractice(type, setup);
}

/* ── Exercise Flow ── */
function showNextExercise() {
  haltExercise(); // never let the previous question's audio overlap

  // Endless mode: extend plan on-demand
  if (state.sessionEndless && state.sessionIndex >= state.sessionPlan.length) {
    state.sessionPlan.push({ type: randFrom(state.sessionTypes) });
  }

  if (!state.sessionEndless && state.sessionIndex >= state.sessionPlan.length) {
    showSessionComplete();
    return;
  }

  const planItem = state.sessionPlan[state.sessionIndex];

  // Update progress bar (in endless mode show rolling windows)
  const total = state.sessionEndless ? state.sessionLength : state.sessionPlan.length;
  const pct   = state.sessionEndless
    ? ((state.sessionIndex % total) / total) * 100
    : (state.sessionIndex / total) * 100;
  document.getElementById('modal-progress-fill').style.width = pct + '%';

  state.answered    = false;
  state.firstResult = null; // first guess decides accuracy; retries are free
  state.startTime   = Date.now();
  clearTimeout(state.multiClearTimer);

  try {
    state.exercise = generateExercise(planItem.type);
  } catch (e) {
    console.error('generateExercise failed', e);
    state.sessionIndex++;
    showNextExercise();
    return;
  }

  renderExercise(state.exercise);

  // Auto-play after 400ms (cancelled if the user quits first)
  state.autoPlayTimer = setTimeout(() => {
    if (!state.answered) handlePlay();
  }, 400);
}

function renderExercise(ex) {
  document.getElementById('exercise-type-label').textContent = TYPE_LABELS[ex.type] || ex.type;
  document.getElementById('question-text').textContent = ex.question;
  document.getElementById('key-indicator').textContent  = ex.keyLabel || '';

  const playBtn = document.getElementById('btn-play');
  playBtn.classList.remove('playing');

  document.getElementById('feedback-overlay').classList.add('hidden');

  const grid = document.getElementById('choices-grid');
  const isMulti = ex.kind === 'multi';
  grid.classList.toggle('multi', isMulti);
  document.querySelector('.keyboard-hint').innerHTML = isMulti
    ? '<kbd>←</kbd><kbd>→</kbd> move between chords &nbsp;·&nbsp; <kbd>Backspace</kbd> clear &nbsp;·&nbsp; <kbd>Enter</kbd> check &nbsp;·&nbsp; <kbd>Space</kbd> replay'
    : 'Press <kbd>1</kbd>–<kbd>4</kbd> to answer &nbsp;·&nbsp; <kbd>Space</kbd> / <kbd>A</kbd> to replay &nbsp;·&nbsp; <kbd>Enter</kbd> to continue';

  if (isMulti) {
    initMulti(ex);
  } else {
    // Build choices with keyboard shortcut badges
    grid.innerHTML = ex.choices.map((c, i) => `
      <button class="choice-btn" data-index="${i}" onclick="handleAnswer(${i})">
        <span class="choice-shortcut">${i + 1}</span>
        ${c.label}
      </button>
    `).join('');
  }

  // Clear piano highlights
  document.querySelectorAll('.piano-key.active').forEach(k => k.classList.remove('active'));
}

/* ── Progression answers: chord strip + one shared keypad ──
   Guess until right. Only the FIRST check of each chord counts toward
   accuracy, skill ratings and XP; later attempts are free. */

const KEYPAD_GROUPS = [
  { id: 'diatonic',  label: 'Diatonic' },
  { id: 'borrowed',  label: 'Borrowed' },
  { id: 'chromatic', label: 'Colour' },
  { id: 'sus',       label: 'Sus' },
];

function initMulti(ex) {
  state.multi = {
    slots:  ex.slots.map(() => ({ n: null, t: null, locked: false, first: null, wrong: false, given: false })),
    active: 0,
    missed: false, // any wrong check yet? (shows "Show answer")
  };
  renderMultiGrid(ex);
}

function answerLabel(sel) {
  const n = PROG_CHORD_BY_ID[sel.n].label;
  return sel.t ? `${n}/${PROG_CHORD_BY_ID[sel.t].label}` : n;
}

function renderMultiGrid(ex) {
  const m      = state.multi;
  const done   = state.answered;
  const active = done ? null : m.slots[m.active]; // nothing to highlight once finished

  // Chord strip: I – [slot] – [slot] …
  const slotHtml = m.slots.map((s, r) => {
    const usual   = PROG_CHORD_BY_ID[ex.slots[r].correct].label;
    const text    = s.n ? answerLabel(s) : '?';
    const caption = s.locked && s.n && !s.given && answerLabel(s) !== usual ? `usually ${usual}` : `Chord ${r + 2}`;
    const cls = [
      'prog-slot',
      s.locked ? (s.given ? 'given' : 'locked') : '',
      s.wrong ? 'wrong' : '',
      !done && !s.locked && r === m.active ? 'active' : '',
      s.n ? 'filled' : '',
    ].join(' ');
    return `
      <div class="prog-slot-wrap">
        <button class="${cls}" onclick="setActiveSlot(${r})" ${s.locked || done ? 'disabled' : ''}
          aria-label="Chord ${r + 2}: ${s.n ? text : 'empty'}">${text}</button>
        <div class="prog-slot-caption">${caption}</div>
      </div>`;
  }).join('<span class="prog-dash">–</span>');

  // One keypad, filling whichever slot is active
  const keypadDisabled = done || !active || active.locked;
  const key = (part, value, label, selected) => `
    <button class="key ${selected ? 'selected' : ''} ${value ? `grp-${PROG_CHORD_BY_ID[value].group}` : 'key-none'}"
      data-part="${part}" data-value="${value}" onclick="pressKey('${part}', '${value}')"
      ${keypadDisabled ? 'disabled' : ''}>${label}</button>`;

  const groups = KEYPAD_GROUPS.map(g => {
    const opts = ex.options.filter(o => PROG_CHORD_BY_ID[o.value].group === g.id);
    if (!opts.length) return '';
    return `
      <div class="keypad-group">
        <div class="keypad-label">${g.label}</div>
        <div class="keypad-keys keys-${g.id}">${opts.map(o => key('n', o.value, o.label, active && active.n === o.value)).join('')}</div>
      </div>`;
  }).join('');

  const slashRow = ex.slash ? `
    <div class="keypad-group">
      <div class="keypad-label">Slash</div>
      <div class="keypad-keys keypad-slash">
        ${key('t', '', 'none', active && active.n && !active.t)}
        ${ex.targets.map(o => key('t', o.value, `/${o.label}`, active && active.t === o.value)).join('')}
      </div>
    </div>` : '';

  const missing = m.slots.filter(s => !s.locked && !s.n).length;
  const mainBtn = done
    ? `<button class="btn-primary multi-check" id="btn-multi-check" onclick="nextFromMulti()">Next</button>`
    : `<button class="btn-primary multi-check" id="btn-multi-check" onclick="checkMulti()" ${missing ? 'disabled' : ''}>
         ${missing ? `Fill ${missing} more` : 'Check'}</button>`;
  const giveUp  = !done && m.missed
    ? `<button class="btn-ghost multi-reveal" onclick="revealMulti()">Show answer</button>` : '';

  document.getElementById('choices-grid').innerHTML = `
    <div class="prog-strip">
      <div class="prog-slot-wrap">
        <div class="prog-slot tonic">I</div>
        <div class="prog-slot-caption">Chord 1</div>
      </div>
      <span class="prog-dash">–</span>
      ${slotHtml}
    </div>
    <div class="keypad ${keypadDisabled ? 'is-disabled' : ''}">${groups}${slashRow}</div>
    <div class="multi-actions">${giveUp}${mainBtn}</div>`;
}

function setActiveSlot(r) {
  const m = state.multi;
  if (state.answered || !m || !m.slots[r] || m.slots[r].locked) return;
  m.active = r;
  renderMultiGrid(state.exercise);
}

/** Next unlocked slot after `from` (wrapping), preferring empty ones. */
function nextOpenSlot(from) {
  const s = state.multi.slots, n = s.length;
  for (let k = 1; k <= n; k++) { const r = (from + k) % n; if (!s[r].locked && !s[r].n) return r; }
  for (let k = 1; k <= n; k++) { const r = (from + k) % n; if (!s[r].locked) return r; }
  return from;
}

function pressKey(part, value) {
  const ex = state.exercise, m = state.multi;
  if (state.answered || !m) return;
  const slot = m.slots[m.active];
  if (!slot || slot.locked) return;

  if (part === 'n') {
    slot.n = value;
    // Without slash chords, a numeral completes the chord: move on
    if (!ex.slash) m.active = nextOpenSlot(m.active);
  } else {
    if (!slot.n) return;          // pick the numeral first
    slot.t = value || null;
    m.active = nextOpenSlot(m.active);
  }
  renderMultiGrid(ex);
}

function clearActiveSlot() {
  const m = state.multi;
  const slot = m && m.slots[m.active];
  if (state.answered || !slot || slot.locked) return;
  slot.n = null; slot.t = null;
  renderMultiGrid(state.exercise);
}

function isSlotCorrect(r) {
  const s = state.multi.slots[r];
  const c = chordAnswerParts(state.exercise.slots[r].correct);
  return sameSound(chordPitchClasses(s.n, s.t), chordPitchClasses(c.numeral, c.target));
}

function checkMulti() {
  const ex = state.exercise, m = state.multi;
  if (state.answered || !ex || ex.kind !== 'multi') return;
  const open = m.slots.map((s, r) => r).filter(r => !m.slots[r].locked);
  if (open.some(r => !m.slots[r].n)) return;

  const rt = Date.now() - (state.startTime || Date.now());
  let anyWrong = false;
  open.forEach(r => {
    const s  = m.slots[r];
    const ok = isSlotCorrect(r);
    if (s.first === null) {
      // First attempt on this chord: this is the one that counts
      s.first = ok;
      adaptive.update(`progression_chord_${ex.slots[r].correct}`, ok, rt);
    }
    if (ok) s.locked = true;
    else { s.wrong = true; anyWrong = true; }
  });

  if (!anyWrong) { finishMulti(rt); return; }

  m.missed = true;
  m.active = open.find(r => !m.slots[r].locked);
  showFeedbackPanel(false, 'Not quite — try again', 'Correct chords are locked in. The wrong ones were cleared.');
  renderMultiGrid(ex);
  // Let the red flash show, then clear the wrong guesses for another try
  clearTimeout(state.multiClearTimer);
  state.multiClearTimer = setTimeout(() => {
    if (state.exercise !== ex || state.answered) return;
    m.slots.forEach(s => { if (s.wrong) { s.wrong = false; s.n = null; s.t = null; } });
    renderMultiGrid(ex);
  }, 700);
}

/** Give up: fill in the remaining chords (they already count as missed). */
function revealMulti() {
  const ex = state.exercise, m = state.multi;
  if (state.answered || !m) return;
  clearTimeout(state.multiClearTimer);
  m.slots.forEach((s, r) => {
    if (s.locked) return;
    const c = chordAnswerParts(ex.slots[r].correct);
    s.n = c.numeral; s.t = c.target; s.locked = true; s.given = true; s.wrong = false;
    if (s.first === null) { s.first = false; adaptive.update(`progression_chord_${ex.slots[r].correct}`, false, 0); }
  });
  finishMulti(Date.now() - (state.startTime || Date.now()));
}

function finishMulti(rt) {
  const ex = state.exercise, m = state.multi;
  state.answered = true;
  clearTimeout(state.multiClearTimer);

  const nFirst   = m.slots.filter(s => s.first).length;
  const allFirst = nFirst === m.slots.length;
  adaptive.update('progression_overall', allFirst, rt);

  renderMultiGrid(ex);
  const title = allFirst ? 'Correct!' : `${nFirst} of ${m.slots.length} right on the first try`;
  showFeedbackPanel(allFirst, title, ex.explain);

  // XP from first attempts only: 4 per chord, +5 for the whole progression
  const xp = Math.max(2, nFirst * 4 + (allFirst ? 5 : 0));
  commitResult(allFirst, xp, rt, { autoAdvance: false });
}

function nextFromMulti() {
  state.sessionIndex++;
  advanceExercise();
}

/* ── Play / Replay ── */
function playExercise(fn) {
  if (!state.exercise || !isExerciseOpen()) return;
  audio.stopAll(); // restart cleanly instead of layering replays
  const playBtn = document.getElementById('btn-play');
  playBtn.classList.add('playing');
  fn().then(() => {
    setTimeout(() => playBtn.classList.remove('playing'), 2000);
  }).catch(() => playBtn.classList.remove('playing'));
}

function handlePlay()   { if (state.exercise) playExercise(state.exercise.play); }
function handleReplay() { if (state.exercise) playExercise(state.exercise.replay); }

/* ── Answer Handling ── */
function handleAnswer(choiceIndex) {
  const ex = state.exercise;
  if (state.answered || !ex || ex.kind === 'multi') return;
  const btn = document.querySelectorAll('.choice-btn')[choiceIndex];
  if (!btn || btn.disabled) return;

  const correct        = choiceIndex === ex.correctIndex;
  const responseTimeMs = Date.now() - (state.startTime || Date.now());

  // Only the first guess counts toward ratings and accuracy
  if (state.firstResult === null) {
    state.firstResult = correct;
    adaptive.update(ex.skillKey, correct, responseTimeMs);
    adaptive.update(`${ex.type}_overall`, correct, responseTimeMs);
  }

  if (!correct) {
    // Free retry: mark this choice wrong and let them try again
    btn.classList.add('incorrect');
    btn.disabled = true;
    showFeedbackPanel(false, 'Not quite — try again', '');
    return;
  }

  state.answered = true;
  btn.classList.add('correct');
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  const first = state.firstResult;
  showFeedbackPanel(true, first ? 'Correct!' : 'Got it', ex.explain);

  let xpEarned = first ? 10 : 2;
  if (first && responseTimeMs < 3000) xpEarned += 5;
  commitResult(first, xpEarned, responseTimeMs);
}

/**
 * Shared bookkeeping after any answer: XP, session + lifetime stats,
 * persistence, achievements, and (optionally) advancing.
 */
function commitResult(correct, xpEarned, responseTimeMs, { autoAdvance = true } = {}) {
  const ex = state.exercise;

  state.xp        += xpEarned;
  state.sessionXp += xpEarned;
  if (correct) state.sessionCorrect++;

  // Per-type stats
  if (!state.sessionStats[ex.type]) state.sessionStats[ex.type] = { correct: 0, total: 0 };
  state.sessionStats[ex.type].total++;
  if (correct) state.sessionStats[ex.type].correct++;

  // Lifetime stats
  const st = state.stats;
  st.totalAnswered++;
  if (correct) {
    st.totalCorrect++;
    state.combo++;
    st.bestCombo = Math.max(st.bestCombo, state.combo);
    if (responseTimeMs < 2000) st.fastCorrect++;
  } else {
    state.combo = 0;
  }

  saveState();
  updateHeaderUI();
  announceAchievements(checkAchievements());

  document.getElementById('modal-xp').textContent = `+${state.sessionXp} XP`;

  if (!autoAdvance) return;
  // Auto-proceed: immediate advance on correct; otherwise 1.5s
  const delay = (correct && state.settings.autoProceed) ? 600 : 1500;
  state.advanceTimer = setTimeout(() => {
    state.sessionIndex++;
    advanceExercise();
  }, delay);
}

function showFeedbackPanel(correct, title, explain) {
  const color   = correct ? 'var(--success)' : 'var(--error)';
  const overlay = document.getElementById('feedback-overlay');
  overlay.classList.remove('hidden');
  overlay.style.borderColor = color;
  document.getElementById('feedback-icon').textContent    = correct ? '✓' : '✗';
  document.getElementById('feedback-icon').style.color    = color;
  document.getElementById('feedback-text').textContent    = title;
  document.getElementById('feedback-text').style.color    = color;
  document.getElementById('feedback-explain').textContent = explain;
}

function advanceExercise() {
  showNextExercise();
}

/* ── Session Complete ── */
function showSessionComplete() {
  haltExercise();
  // Count answered questions (endless mode can stop mid-question)
  const total    = Object.values(state.sessionStats).reduce((s, x) => s + x.total, 0);
  const correct  = state.sessionCorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  document.getElementById('session-correct').textContent   = `${correct}/${total}`;
  document.getElementById('session-accuracy').textContent  = `${accuracy}%`;
  document.getElementById('session-xp-earned').textContent = `+${state.sessionXp}`;

  // Per-type breakdown
  const breakdownEl = document.getElementById('session-breakdown');
  if (breakdownEl) {
    const rows = Object.entries(state.sessionStats).map(([type, s]) => {
      const pct = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
      const cls = pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad';
      return `
        <div class="breakdown-row">
          <span class="breakdown-name">${TYPE_NAMES[type] || type}</span>
          <span class="breakdown-val ${cls}">${s.correct}/${s.total} (${pct}%)</span>
        </div>`;
    });
    breakdownEl.innerHTML = rows.length
      ? `<div class="breakdown-title">By Category</div>${rows.join('')}`
      : '';
  }

  state.totalSessions++;
  if (total >= 10 && correct === total) state.stats.perfectSessions++;
  updateStreak();
  saveState();

  document.getElementById('exercise-modal').classList.add('hidden');
  document.getElementById('session-modal').classList.remove('hidden');

  announceAchievements(checkAchievements());
}

/* ══════════════════════════════════════════
   TOASTS
   ══════════════════════════════════════════ */

function showToast(html, ms = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

function announceAchievements(list) {
  list.forEach((a, i) => {
    setTimeout(() => showToast(
      `<span class="toast-icon">${a.icon}</span>
       <span><strong>Achievement unlocked</strong><br>${a.name}</span>`
    ), i * 600);
  });
}

/* ══════════════════════════════════════════
   BACKUP: EXPORT / IMPORT
   ══════════════════════════════════════════ */

function exportProgress() {
  const data = {
    app: 'eartrain',
    version: 1,
    exportedAt: new Date().toISOString(),
    state: persistableState(),
    skills: adaptive.skills,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `eartrain-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Backup downloaded');
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      showToast('That file isn\'t valid JSON.');
      return;
    }
    if (!data || data.app !== 'eartrain' || typeof data.state !== 'object' || typeof data.skills !== 'object') {
      showToast('That doesn\'t look like an EarTrain backup.');
      return;
    }
    if (!confirm('Replace your current progress with this backup?')) return;

    localStorage.setItem('eartrain_skills', JSON.stringify(data.skills));
    adaptive.load();
    state = defaultState();
    applySavedState(data.state);
    saveState();
    updateHeaderUI();
    switchTab('settings');
    showToast('Progress restored from backup');
  };
  reader.readAsText(file);
}

/* ══════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════ */

function handleKeyDown(e) {
  // Ignore when typing in form fields
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

  const setup = document.getElementById('setup-modal');
  if (!setup.classList.contains('hidden')) {
    if (e.key === 'Escape') closePracticeSetup();
    if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); startFromSetup(); }
    return;
  }

  if (!isExerciseOpen()) return;

  // Progression questions: arrows move between chords, Backspace clears, Enter checks
  if (!state.answered && state.exercise && state.exercise.kind === 'multi') {
    const m = state.multi;
    if (e.key === 'Enter') { e.preventDefault(); checkMulti(); return; }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); clearActiveSlot(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1, n = m.slots.length;
      for (let k = 1; k <= n; k++) {
        const r = (m.active + dir * k + n) % n;
        if (!m.slots[r].locked) { setActiveSlot(r); break; }
      }
      return;
    }
  }

  // 1-4: select answer
  if (!state.answered && e.key >= '1' && e.key <= '4') {
    e.preventDefault();
    handleAnswer(parseInt(e.key, 10) - 1);
    return;
  }

  // Space or A: replay audio (before answering) OR advance (after answering)
  if (e.key === ' ' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    if (state.answered) {
      clearTimeout(state.advanceTimer);
      state.sessionIndex++;
      advanceExercise();
    } else {
      handleReplay();
    }
    return;
  }

  // Enter: advance after answering
  if (e.key === 'Enter' && state.answered) {
    e.preventDefault();
    clearTimeout(state.advanceTimer);
    state.sessionIndex++;
    advanceExercise();
  }
}

/* ══════════════════════════════════════════
   PIANO KEYBOARD
   ══════════════════════════════════════════ */

function buildPianoKeyboard() {
  const container = document.getElementById('piano-keyboard');
  if (!container) return;
  container.innerHTML = '';

  const WHITE_PATTERN = [0, 2, 4, 5, 7, 9, 11];

  for (let midi = 48; midi <= 72; midi++) {
    const noteClass = midi % 12;
    const isWhite   = WHITE_PATTERN.includes(noteClass);

    const key = document.createElement('div');
    key.className    = `piano-key ${isWhite ? 'white' : 'black'}`;
    key.dataset.midi = midi;
    key.title        = midiToName(midi);

    key.addEventListener('click', () => {
      audio.resume().then(() => audio.playNote(midi, audio.now() + 0.02, 0.8, 0.5));
      flashKey(key, 600);
    });

    container.appendChild(key);
  }
}

function flashKey(keyEl, durationMs = 600) {
  keyEl.classList.add('active');
  setTimeout(() => keyEl.classList.remove('active'), durationMs);
}

function highlightKeys(midiNotes) {
  document.querySelectorAll('.piano-key.active').forEach(k => k.classList.remove('active'));
  midiNotes.forEach(midi => {
    const key = document.querySelector(`.piano-key[data-midi="${midi}"]`);
    if (key) key.classList.add('active');
  });
  setTimeout(() => {
    midiNotes.forEach(midi => {
      const key = document.querySelector(`.piano-key[data-midi="${midi}"]`);
      if (key) key.classList.remove('active');
    });
  }, 1500);
}

/* ══════════════════════════════════════════
   RADAR CHART
   ══════════════════════════════════════════ */

function drawRadarChart(canvas) {
  const ctx    = canvas.getContext('2d');
  const cx     = canvas.width  / 2;
  const cy     = canvas.height / 2;
  const radius = Math.min(cx, cy) - 36;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const labels = ['Intervals', 'Chords', 'Scales', 'Functional', 'Pitch', 'Progressions'];
  const types  = ['interval', 'chord', 'scale', 'functional', 'pitch', 'progression'];
  const n      = labels.length;

  const values = types.map(t => {
    const acc = adaptive.getAccuracy(t);
    return acc !== null ? acc / 100 : 0;
  });

  const angleStep  = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  // Grid rings
  [0.25, 0.5, 0.75, 1.0].forEach(scale => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + Math.cos(angle) * radius * scale;
      const y = cy + Math.sin(angle) * radius * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  });

  // Axis spokes
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  values.forEach((v, i) => {
    const angle = startAngle + i * angleStep;
    const x = cx + Math.cos(angle) * radius * Math.max(0.04, v);
    const y = cy + Math.sin(angle) * radius * Math.max(0.04, v);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle   = 'rgba(233,69,96,0.25)';
  ctx.fill();
  ctx.strokeStyle = '#E94560';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Labels
  ctx.fillStyle    = '#E0E0E0';
  ctx.font         = '11px system-ui, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  labels.forEach((label, i) => {
    const angle  = startAngle + i * angleStep;
    const offset = 20;
    const x = cx + Math.cos(angle) * (radius + offset);
    const y = cy + Math.sin(angle) * (radius + offset);
    ctx.fillText(label, x, y);
  });

  // Dots
  values.forEach((v, i) => {
    const angle = startAngle + i * angleStep;
    const x = cx + Math.cos(angle) * radius * Math.max(0.04, v);
    const y = cy + Math.sin(angle) * radius * Math.max(0.04, v);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#E94560';
    ctx.fill();
  });
}

/* ══════════════════════════════════════════
   SETTINGS HANDLERS
   ══════════════════════════════════════════ */

function initSettings() {
  // Session length
  const sel = document.getElementById('session-length-select');
  if (sel) {
    sel.value = String(state.sessionLength);
    sel.addEventListener('change', () => {
      state.sessionLength = parseInt(sel.value, 10);
      saveState();
    });
  }

  // Volume
  const volSlider = document.getElementById('volume-slider');
  if (volSlider) {
    volSlider.value = String(Math.round(audio.volume * 100));
    volSlider.addEventListener('input', () => {
      audio.setVolume(parseInt(volSlider.value, 10) / 100);
    });
  }

  // Interval direction
  const dirSel = document.getElementById('interval-dir-select');
  if (dirSel) {
    dirSel.value = state.settings.intervalDirection;
    dirSel.addEventListener('change', () => {
      state.settings.intervalDirection = dirSel.value;
      saveState();
    });
  }

  // Playback speed
  const speedSel = document.getElementById('playback-speed-select');
  if (speedSel) {
    speedSel.value = state.settings.playbackSpeed;
    speedSel.addEventListener('change', () => {
      state.settings.playbackSpeed = speedSel.value;
      saveState();
    });
  }

  // Scale playback mode
  const scaleSel = document.getElementById('scale-mode-select');
  if (scaleSel) {
    scaleSel.innerHTML = SCALE_PLAY_MODES.map(m => `<option value="${m.id}">${m.label}</option>`).join('');
    scaleSel.value = state.settings.scaleMode;
    scaleSel.addEventListener('change', () => {
      state.settings.scaleMode = scaleSel.value;
      saveState();
    });
  }

  // Fixed root toggle
  const fixedRootChk = document.getElementById('fixed-root-toggle');
  if (fixedRootChk) {
    fixedRootChk.checked = state.settings.fixedRoot;
    fixedRootChk.addEventListener('change', () => {
      state.settings.fixedRoot = fixedRootChk.checked;
      saveState();
    });
  }

  // Auto-proceed toggle
  const autoProceedChk = document.getElementById('auto-proceed-toggle');
  if (autoProceedChk) {
    autoProceedChk.checked = state.settings.autoProceed;
    autoProceedChk.addEventListener('change', () => {
      state.settings.autoProceed = autoProceedChk.checked;
      saveState();
    });
  }

  // Endless mode toggle
  const endlessChk = document.getElementById('endless-mode-toggle');
  if (endlessChk) {
    endlessChk.checked = state.settings.endlessMode;
    endlessChk.addEventListener('change', () => {
      state.settings.endlessMode = endlessChk.checked;
      saveState();
    });
  }

  // Reset
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        localStorage.removeItem('eartrain_skills');
        localStorage.removeItem(STATE_KEY);
        adaptive.skills = {};
        state = defaultState();
        state.currentTab = 'settings';
        updateHeaderUI();
        renderSettingsTab();
        showToast('Progress reset');
      }
    });
  }

  // Backup export / import
  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) exportBtn.addEventListener('click', exportProgress);

  const importBtn   = document.getElementById('btn-import');
  const importInput = document.getElementById('import-file');
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', () => {
      if (importInput.files[0]) importProgress(importInput.files[0]);
      importInput.value = '';
    });
  }
}

/* ══════════════════════════════════════════
   APP INIT
   ══════════════════════════════════════════ */

function initApp() {
  loadState();
  checkAchievements(); // silently credit anything already earned before badges existed
  updateHeaderUI();
  buildPianoKeyboard();
  initSettings();

  document.getElementById('btn-daily-workout').addEventListener('click', startDailyWorkout);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);

  // Practice setup screen
  document.getElementById('setup-modal').addEventListener('click', handleSetupClick);

  // Learn tab: click (or Enter/Space on a focused item) to hear an example
  const learnTab = document.getElementById('tab-learn');
  learnTab.addEventListener('click', e => {
    const el = e.target.closest('[data-play]');
    if (el) handleLearnPlay(el);
  });
  learnTab.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-play]');
    if (el) { e.preventDefault(); handleLearnPlay(el); }
  });

  // Initialize audio on first user interaction
  document.addEventListener('click', () => {
    if (!audio._ready) audio.init();
  }, { once: true });

  switchTab('home');
}

document.addEventListener('DOMContentLoaded', initApp);
