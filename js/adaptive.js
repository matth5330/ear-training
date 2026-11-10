/* ============================================================
   adaptive.js — Adaptive Difficulty / Elo Skill Engine
   ============================================================ */

class AdaptiveEngine {
  constructor() {
    this.STORAGE_KEY = 'eartrain_skills';
    this.BASE_ELO    = 1200;
    this.skills      = {};
    this.load();
  }

  /* ── Persistence ── */
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.skills = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this.skills = {};
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.skills));
    } catch (e) {
      console.warn('AdaptiveEngine: could not save to localStorage', e);
    }
  }

  /* ── Skill Access ── */
  getSkill(key) {
    if (!this.skills[key]) {
      this.skills[key] = {
        elo: this.BASE_ELO,
        attempts: 0,
        correct: 0,
        lastPracticed: null,
      };
    }
    return this.skills[key];
  }

  /* ── Elo Update ── */
  /**
   * outcome: 1 = correct, 0 = wrong
   * responseTimeMs: used to detect "too easy" items (fast correct = bump K slightly)
   */
  update(skillKey, correct, responseTimeMs = 5000) {
    const sk = this.getSkill(skillKey);
    const outcome = correct ? 1 : 0;

    // Expected score based on current elo vs fixed "difficulty" of 1200
    const E = 1 / (1 + Math.pow(10, (1200 - sk.elo) / 400));

    // K factor decreases as attempts increase (but has a floor)
    const K = Math.max(16, 48 - sk.attempts * 0.5);

    sk.elo       = Math.max(400, Math.min(2400, sk.elo + K * (outcome - E)));
    sk.attempts += 1;
    if (correct) sk.correct += 1;
    sk.lastPracticed = Date.now();

    this.save();
  }

  /* ── Level Calculation ── */
  /**
   * Determine which level array index to use for an exercise type.
   * Higher elo → higher level (more items in pool).
   */
  getLevel(exerciseType, maxLevel) {
    const key = `${exerciseType}_overall`;
    const sk  = this.getSkill(key);
    const elo = sk.elo;

    // Map elo range 800–1800 onto 0..maxLevel-1
    const normalized = Math.max(0, Math.min(1, (elo - 800) / 1000));
    return Math.min(maxLevel - 1, Math.floor(normalized * maxLevel));
  }

  /* ── Accuracy ── */
  getAccuracy(exerciseType) {
    const keys = Object.keys(this.skills).filter(k => k.startsWith(exerciseType + '_'));
    if (keys.length === 0) return null;

    let totalAttempts = 0;
    let totalCorrect  = 0;
    keys.forEach(k => {
      const sk = this.skills[k];
      totalAttempts += sk.attempts;
      totalCorrect  += sk.correct;
    });

    return totalAttempts === 0 ? null : Math.round((totalCorrect / totalAttempts) * 100);
  }

  /* ── Weakest Skills ── */
  /**
   * Returns the n weakest skill keys for a given exercise type,
   * sorted by accuracy (ascending).
   */
  getWeakestSkills(exerciseType, n = 3) {
    const prefix = exerciseType + '_';
    const keys = Object.keys(this.skills)
      .filter(k => k.startsWith(prefix) && this.skills[k].attempts >= 3);

    if (keys.length === 0) return [];

    return keys
      .map(k => {
        const sk = this.skills[k];
        const acc = sk.attempts > 0 ? sk.correct / sk.attempts : 0;
        return { key: k, acc, name: k.slice(prefix.length), attempts: sk.attempts };
      })
      .sort((a, b) => a.acc - b.acc)
      .slice(0, n);
  }

  /* ── Session Plan ── */
  /**
   * Generate a session plan array of { type } objects.
   * Balances all 4 types, with emphasis on weaker areas.
   */
  generateSessionPlan(totalQuestions = 15, types = ['interval', 'chord', 'scale', 'functional']) {
    const accuracies = types.map(t => {
      const acc = this.getAccuracy(t);
      return { type: t, acc: acc === null ? 50 : acc };
    });

    // Invert accuracy to get weights: lower accuracy → more questions
    const weights = accuracies.map(a => Math.max(5, 100 - a.acc));
    const totalWeight = weights.reduce((s, w) => s + w, 0);

    const plan = [];
    const counts = weights.map(w => Math.max(1, Math.round((w / totalWeight) * totalQuestions)));

    // Adjust so total == totalQuestions
    let sum = counts.reduce((s, c) => s + c, 0);
    while (sum < totalQuestions) { counts[0]++; sum++; }
    while (sum > totalQuestions) { const idx = counts.indexOf(Math.max(...counts)); counts[idx]--; sum--; }

    counts.forEach((count, i) => {
      for (let j = 0; j < count; j++) {
        plan.push({ type: types[i] });
      }
    });

    return shuffle(plan);
  }
}

const adaptive = new AdaptiveEngine();
