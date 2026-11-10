/* ============================================================
   app.js — Main Application Logic
   ============================================================ */

/* ── App State ── */
const STATE_KEY = 'eartrain_state';

let state = {
  streak: 0,
  lastPracticeDate: null,
  xp: 0,
  totalSessions: 0,
  sessionLength: 15,

  // Session
  sessionPlan: [],
  sessionIndex: 0,
  sessionCorrect: 0,
  sessionXp: 0,
  sessionStats: {},    // { type: { correct, total } }

  // Current exercise
  exercise: null,
  answered: false,
  startTime: null,
  advanceTimer: null,

  // UI
  currentTab: 'home',

  // Settings (ToneDear features)
  settings: {
    intervalDirection: 'ascending', // 'ascending'|'descending'|'harmonic'|'mixed'
    fixedRoot:         false,        // always use C4 as root for intervals
    playbackSpeed:     'normal',     // 'fast'|'normal'|'slow'
    autoProceed:       false,        // advance immediately on correct answer
    endlessMode:       false,        // never-ending session
  },
};

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
function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Deep merge settings
      if (saved.settings) {
        state.settings = Object.assign(state.settings, saved.settings);
      }
      const { settings, ...rest } = saved;
      Object.assign(state, rest);
    }
  } catch (e) { /* use defaults */ }
}

function saveState() {
  try {
    const toSave = {
      streak: state.streak,
      lastPracticeDate: state.lastPracticeDate,
      xp: state.xp,
      totalSessions: state.totalSessions,
      sessionLength: state.sessionLength,
      settings: state.settings,
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(toSave));
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
  const maxLevels = { interval: INTERVAL_LEVELS.length, chord: CHORD_LEVELS.length, scale: SCALE_LEVELS.length, functional: FUNCTIONAL_LEVELS.length, pitch: PERFECT_PITCH_LEVELS.length, progression: 3 };

  const html = categories.map(cat => {
    const acc   = adaptive.getAccuracy(cat.type);
    const level = adaptive.getLevel(cat.type, maxLevels[cat.type]);
    const accText  = acc !== null ? `${acc}%` : 'New';
    const accClass = acc === null ? '' : acc >= 75 ? 'good' : 'warn';
    return `
      <div class="train-card">
        <div class="train-card-icon">${cat.icon}</div>
        <div class="train-card-body">
          <div class="train-card-title">${cat.title}</div>
          <div class="train-card-sub">${cat.desc}</div>
          <div class="train-card-meta">
            <span class="meta-pill">Level ${level + 1}</span>
            <span class="meta-pill ${accClass}">${accText} accuracy</span>
          </div>
        </div>
        <button class="train-card-btn" onclick="startCategoryPractice('${cat.type}')">Practice</button>
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
}

/* ── Learn Tab ── */
function renderLearnTab() {
  const tbody = document.querySelector('#interval-table tbody');
  if (tbody) {
    tbody.innerHTML = INTERVALS.slice(1).map(iv => `
      <tr>
        <td><strong>${iv.name}</strong> (${iv.abbr})</td>
        <td>${iv.semitones}</td>
        <td>${iv.ref}</td>
      </tr>`).join('');
  }

  const chordContainer = document.getElementById('chord-cards');
  if (chordContainer) {
    chordContainer.innerHTML = CHORD_TYPES.map(c => `
      <div class="learn-mini-card">
        <div class="learn-mini-title">${c.name} (${c.abbr})</div>
        <div class="learn-mini-sub">${c.character}</div>
      </div>`).join('');
  }

  const scaleContainer = document.getElementById('scale-cards');
  if (scaleContainer) {
    scaleContainer.innerHTML = SCALE_TYPES.map(s => `
      <div class="learn-mini-card">
        <div class="learn-mini-title">${s.name}</div>
        <div class="learn-mini-sub">${s.character}</div>
      </div>`).join('');
  }

  // Chord progressions reference
  const progContainer = document.getElementById('prog-cards');
  if (progContainer) {
    progContainer.innerHTML = CHORD_PROGRESSIONS.map(p => `
      <div class="learn-mini-card">
        <div class="learn-mini-title">${p.name}</div>
        <div class="learn-mini-sub">${p.description}</div>
      </div>`).join('');
  }
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

function startDailyWorkout() {
  const total = state.sessionLength;
  const plan  = adaptive.generateSessionPlan(total, ALL_TYPES);
  openExerciseModal(plan);
}

function startCategoryPractice(type) {
  const total = state.sessionLength;
  const plan  = Array.from({ length: total }, () => ({ type }));
  openExerciseModal(plan);
}

function openExerciseModal(plan) {
  audio.init();
  state.sessionPlan    = plan;
  state.sessionIndex   = 0;
  state.sessionCorrect = 0;
  state.sessionXp      = 0;
  state.sessionStats   = {};

  document.getElementById('modal-xp').textContent = '+0 XP';

  // Show/hide stop button based on endless mode
  const stopBtn = document.getElementById('btn-stop-endless');
  if (stopBtn) stopBtn.style.display = state.settings.endlessMode ? 'flex' : 'none';

  document.getElementById('exercise-modal').classList.remove('hidden');
  showNextExercise();
}

function closeExerciseModal() {
  document.getElementById('exercise-modal').classList.add('hidden');
  clearTimeout(state.advanceTimer);
}

function closeSessionModal() {
  document.getElementById('session-modal').classList.add('hidden');
  renderHomeTab();
}

function continueSession() {
  document.getElementById('session-modal').classList.add('hidden');
  startDailyWorkout();
}

/* ── Exercise Flow ── */
function showNextExercise() {
  // Endless mode: extend plan on-demand
  if (state.settings.endlessMode && state.sessionIndex >= state.sessionPlan.length) {
    state.sessionPlan.push({ type: randFrom(ALL_TYPES) });
  }

  if (!state.settings.endlessMode && state.sessionIndex >= state.sessionPlan.length) {
    showSessionComplete();
    return;
  }

  const planItem = state.sessionPlan[state.sessionIndex];

  // Update progress bar (in endless mode show rolling 15-question windows)
  const total = state.settings.endlessMode ? state.sessionLength : state.sessionPlan.length;
  const pct   = state.settings.endlessMode
    ? ((state.sessionIndex % total) / total) * 100
    : (state.sessionIndex / total) * 100;
  document.getElementById('modal-progress-fill').style.width = pct + '%';

  state.answered  = false;
  state.startTime = Date.now();

  try {
    state.exercise = generateExercise(planItem.type);
  } catch (e) {
    console.error('generateExercise failed', e);
    state.sessionIndex++;
    showNextExercise();
    return;
  }

  renderExercise(state.exercise);

  // Auto-play after 400ms
  setTimeout(() => {
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

  // Build choices with keyboard shortcut badges
  const grid = document.getElementById('choices-grid');
  grid.innerHTML = ex.choices.map((c, i) => `
    <button class="choice-btn" data-index="${i}" onclick="handleAnswer(${i})">
      <span class="choice-shortcut">${i + 1}</span>
      ${c.label}
    </button>
  `).join('');

  // Clear piano highlights
  document.querySelectorAll('.piano-key.active').forEach(k => k.classList.remove('active'));
}

/* ── Play / Replay ── */
function handlePlay() {
  if (!state.exercise) return;
  const playBtn = document.getElementById('btn-play');
  playBtn.classList.add('playing');
  state.exercise.play().then(() => {
    setTimeout(() => playBtn.classList.remove('playing'), 2000);
  }).catch(() => playBtn.classList.remove('playing'));
}

function handleReplay() {
  if (!state.exercise) return;
  const playBtn = document.getElementById('btn-play');
  playBtn.classList.add('playing');
  state.exercise.replay().then(() => {
    setTimeout(() => playBtn.classList.remove('playing'), 2000);
  }).catch(() => playBtn.classList.remove('playing'));
}

/* ── Answer Handling ── */
function handleAnswer(choiceIndex) {
  if (state.answered || !state.exercise) return;
  state.answered = true;

  const ex             = state.exercise;
  const correct        = choiceIndex === ex.correctIndex;
  const responseTimeMs = Date.now() - (state.startTime || Date.now());

  // XP
  let xpEarned = correct ? 10 : 2;
  if (correct && responseTimeMs < 3000) xpEarned += 5;

  state.xp        += xpEarned;
  state.sessionXp += xpEarned;
  if (correct) state.sessionCorrect++;

  // Per-type stats
  if (!state.sessionStats[ex.type]) state.sessionStats[ex.type] = { correct: 0, total: 0 };
  state.sessionStats[ex.type].total++;
  if (correct) state.sessionStats[ex.type].correct++;

  // Update Elo
  adaptive.update(ex.skillKey, correct, responseTimeMs);
  adaptive.update(`${ex.type}_overall`, correct, responseTimeMs);

  saveState();
  updateHeaderUI();

  document.getElementById('modal-xp').textContent = `+${state.sessionXp} XP`;

  showFeedback(correct, ex, choiceIndex);
  document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);

  // Auto-proceed: immediate advance on correct; otherwise 1.5s
  const delay = (correct && state.settings.autoProceed) ? 600 : 1500;
  state.advanceTimer = setTimeout(() => {
    state.sessionIndex++;
    advanceExercise();
  }, delay);
}

function showFeedback(correct, ex, selectedIndex) {
  const btns = document.querySelectorAll('.choice-btn');

  if (btns[selectedIndex]) {
    btns[selectedIndex].classList.add(correct ? 'correct' : 'incorrect');
  }
  if (!correct && btns[ex.correctIndex]) {
    btns[ex.correctIndex].classList.add('reveal');
  }

  const overlay = document.getElementById('feedback-overlay');
  overlay.classList.remove('hidden');
  document.getElementById('feedback-icon').textContent    = correct ? '✓' : '✗';
  document.getElementById('feedback-text').textContent    = correct ? 'Correct!' : 'Not quite...';
  document.getElementById('feedback-explain').textContent = ex.explain;
  overlay.style.borderColor = correct ? 'var(--success)' : 'var(--error)';
  document.getElementById('feedback-icon').style.color = correct ? 'var(--success)' : 'var(--error)';
  document.getElementById('feedback-text').style.color  = correct ? 'var(--success)' : 'var(--error)';
}

function advanceExercise() {
  showNextExercise();
}

/* ── Session Complete ── */
function showSessionComplete() {
  const total    = state.sessionPlan.length;
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
  updateStreak();
  saveState();

  document.getElementById('exercise-modal').classList.add('hidden');
  document.getElementById('session-modal').classList.remove('hidden');
}

/* ══════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════ */

function handleKeyDown(e) {
  // Ignore when typing in form fields
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

  const modal = document.getElementById('exercise-modal');
  if (modal.classList.contains('hidden')) return;

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
        state = {
          streak: 0, lastPracticeDate: null, xp: 0, totalSessions: 0, sessionLength: 15,
          sessionPlan: [], sessionIndex: 0, sessionCorrect: 0, sessionXp: 0,
          sessionStats: {}, exercise: null, answered: false, startTime: null,
          advanceTimer: null, currentTab: 'settings',
          settings: { intervalDirection: 'ascending', fixedRoot: false, playbackSpeed: 'normal', autoProceed: false, endlessMode: false },
        };
        updateHeaderUI();
        alert('Progress reset!');
      }
    });
  }
}

/* ══════════════════════════════════════════
   APP INIT
   ══════════════════════════════════════════ */

function initApp() {
  loadState();
  updateHeaderUI();
  buildPianoKeyboard();
  initSettings();

  document.getElementById('btn-daily-workout').addEventListener('click', startDailyWorkout);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);

  // Initialize audio on first user interaction
  document.addEventListener('click', () => {
    if (!audio._ready) audio.init();
  }, { once: true });

  switchTab('home');
}

document.addEventListener('DOMContentLoaded', initApp);
