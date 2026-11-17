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

    // Current exercise
    exercise: null,
    answered: false,
    startTime: null,
    advanceTimer: null,

    // UI
    currentTab: 'home',

    // Settings
    settings: {
      intervalDirection: 'ascending', // 'ascending'|'descending'|'harmonic'|'mixed'
      fixedRoot:         false,        // always use C4 as root for intervals
      playbackSpeed:     'normal',     // 'fast'|'normal'|'slow'
      autoProceed:       false,        // advance immediately on correct answer
      endlessMode:       false,        // never-ending session
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
    progContainer.innerHTML = CHORD_PROGRESSIONS.map(p => card('progression', p.id, p.name, p.description)).join('');
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
      // Melodic (ascending), then harmonic
      audio.playNote(root,         t,             0.9 * sp, 0.5);
      audio.playNote(root + semis, t + 0.7 * sp,  0.9 * sp, 0.5);
      audio.playChord([root, root + semis], t + 1.7 * sp, 1.2 * sp, 0.35);
      return 3.0 * sp;
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
    case 'progression': {
      const prog = CHORD_PROGRESSIONS.find(p => p.id === id);
      if (!prog) return 0;
      const gap = 0.9 * sp;
      const bass = 48; // C3 — keeps the voicings in a comfortable register
      prog.degrees.forEach((deg, i) => {
        const quality = CHORD_TYPES.find(c => c.id === prog.qualities[i]);
        const notes   = quality.intervals.map(iv => bass + deg + iv);
        audio.playChord(notes, t + i * gap, 0.85 * sp, 0.28);
      });
      return prog.degrees.length * gap + 0.85 * sp;
    }
  }
  return 0;
}

function handleLearnPlay(el) {
  audio.resume().then(() => {
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
  state.combo          = 0;

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

  // Update Elo
  adaptive.update(ex.skillKey, correct, responseTimeMs);
  adaptive.update(`${ex.type}_overall`, correct, responseTimeMs);

  saveState();
  updateHeaderUI();
  announceAchievements(checkAchievements());

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
  clearTimeout(state.advanceTimer);
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
