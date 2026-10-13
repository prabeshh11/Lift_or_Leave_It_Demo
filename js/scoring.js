'use strict';

/**
 * Sum of all technique points across choices.
 * @returns {number}  0-50
 */
function calculateTechniqueTotal() {
  const session = getSession();
  if (!session) return 0;
  return session.choices.reduce((sum, c) => sum + (c.points || 0), 0);
}

/**
 * Time bonus based on seconds remaining when session ended.
 * @returns {number}  0 | 10 | 20 | 30
 */
function calculateTimeBonus() {
  const session = getSession();
  if (!session) return 0;
  return getTimeTier(session.timeRemaining);
}

/**
 * No-injury bonus: 20 if ALL 5 choices were 'best', else 0.
 * @returns {number}  0 | 20
 */
function calculateNoInjuryBonus() {
  const session = getSession();
  if (!session) return 0;
  return session.noInjuryBonus ? 20 : 0;
}

/**
 * Grand total score.
 * @returns {number}  0-100
 */
function calculateTotal() {
  return calculateTechniqueTotal() + calculateTimeBonus() + calculateNoInjuryBonus();
}

/**
 * True if total score >= 60 (pass mark).
 * @returns {boolean}
 */
function isPassed() {
  return calculateTotal() >= 60;
}
