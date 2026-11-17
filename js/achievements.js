/* ============================================================
   achievements.js — Badge definitions and unlock checks
   Each test receives the app state; `adaptive` and ALL_TYPES are
   globals available at runtime.
   ============================================================ */

function overallSkill(type) {
  return adaptive.skills[`${type}_overall`];
}

const ACHIEVEMENTS = [
  // Sessions
  { id: 'first_session', icon: '🎵', name: 'First Notes',    desc: 'Complete your first session',
    test: s => s.totalSessions >= 1 },
  { id: 'sessions_10',   icon: '🎶', name: 'Regular',        desc: 'Complete 10 sessions',
    test: s => s.totalSessions >= 10 },
  { id: 'sessions_50',   icon: '🎼', name: 'Dedicated',      desc: 'Complete 50 sessions',
    test: s => s.totalSessions >= 50 },

  // Streaks
  { id: 'streak_3',      icon: '🔥', name: 'On a Roll',      desc: 'Practice 3 days in a row',
    test: s => s.streak >= 3 },
  { id: 'streak_7',      icon: '📅', name: 'Week Warrior',   desc: 'Practice 7 days in a row',
    test: s => s.streak >= 7 },
  { id: 'streak_30',     icon: '🏆', name: 'Unstoppable',    desc: 'Practice 30 days in a row',
    test: s => s.streak >= 30 },

  // Performance
  { id: 'combo_10',      icon: '⚡', name: 'Hot Streak',     desc: '10 correct answers in a row',
    test: s => s.stats.bestCombo >= 10 },
  { id: 'combo_25',      icon: '💫', name: 'In the Zone',    desc: '25 correct answers in a row',
    test: s => s.stats.bestCombo >= 25 },
  { id: 'perfect',       icon: '💯', name: 'Flawless',       desc: '100% on a session of 10+ questions',
    test: s => s.stats.perfectSessions >= 1 },
  { id: 'quick_ear',     icon: '👂', name: 'Quick Ear',      desc: 'Answer correctly in under 2 seconds',
    test: s => s.stats.fastCorrect >= 1 },

  // Volume
  { id: 'correct_100',   icon: '✅', name: 'Century',        desc: '100 correct answers',
    test: s => s.stats.totalCorrect >= 100 },
  { id: 'correct_1000',  icon: '🎖️', name: 'Thousand Ears',  desc: '1,000 correct answers',
    test: s => s.stats.totalCorrect >= 1000 },
  { id: 'xp_1000',       icon: '⭐', name: 'Rising Star',    desc: 'Earn 1,000 XP',
    test: s => s.xp >= 1000 },
  { id: 'xp_10000',      icon: '🌟', name: 'Superstar',      desc: 'Earn 10,000 XP',
    test: s => s.xp >= 10000 },

  // Breadth / mastery
  { id: 'all_rounder',   icon: '🧭', name: 'All-Rounder',    desc: 'Try all six exercise types',
    test: () => ALL_TYPES.every(t => overallSkill(t) && overallSkill(t).attempts > 0) },
  { id: 'specialist',    icon: '🎯', name: 'Specialist',     desc: '90% accuracy over 50+ answers in one category',
    test: () => ALL_TYPES.some(t => {
      const sk = overallSkill(t);
      return sk && sk.attempts >= 50 && sk.correct / sk.attempts >= 0.9;
    }) },
];

/**
 * Unlock any newly-earned achievements.
 * Returns the list of achievements unlocked by this call.
 */
function checkAchievements() {
  const unlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (state.achievements[a.id]) return;
    let earned = false;
    try { earned = a.test(state); } catch (e) { /* missing data — not earned */ }
    if (earned) {
      state.achievements[a.id] = Date.now();
      unlocked.push(a);
    }
  });
  if (unlocked.length) saveState();
  return unlocked;
}
