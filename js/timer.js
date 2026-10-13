'use strict';

let _intervalId       = null;
let _secondsRemaining = 180;
let _isPaused         = false;
let _isFrozen         = false;

/**
 * Format seconds into MM:SS string.
 * @param {number} s
 * @returns {string}
 */
function formatTime(s) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Returns the point value for the time bonus based on seconds remaining.
 * @param {number} secs
 * @returns {number}
 */
function getTimeTier(secs) {
  if (secs > 90)  return 30;
  if (secs >= 30) return 20;
  if (secs > 0)   return 10;
  return 0;
}

/**
 * Update the #timer-display element and aria-live region.
 */
function _updateDisplay() {
  const el = document.getElementById('timer-display');
  if (el) el.textContent = formatTime(_secondsRemaining);

  // Aria-live announcement at 30 seconds
  if (_secondsRemaining === 30) {
    const live = document.getElementById('timer-live');
    if (live) live.textContent = '30 seconds remaining';
  }
}

/**
 * Called each tick. Decrements timer; triggers expiry if needed.
 */
function _tick() {
  if (_isPaused || _isFrozen) return;
  _secondsRemaining--;
  _updateDisplay();
  _saveTime();

  if (_secondsRemaining <= 0) {
    _secondsRemaining = 0;
    _updateDisplay();
    onTimerExpired();
  }
}

/**
 * Persist current remaining time into sessionStorage.
 */
function _saveTime() {
  const session = getSession();
  if (session) {
    session.timeRemaining = _secondsRemaining;
    saveSession(session);
  }
}

/**
 * Start the countdown timer.
 * Reads initial value from SESSION.timeRemaining if available.
 */
function startTimer() {
  const session = getSession();
  if (session) _secondsRemaining = session.timeRemaining;
  _updateDisplay();
  _isFrozen = false;
  _isPaused = false;
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = setInterval(_tick, 1000);
}

/**
 * Pause the timer (e.g. during animation playback).
 */
function pauseTimer() {
  if (_isFrozen) return;
  _isPaused = true;
  const indicator = document.getElementById('pause-indicator');
  if (indicator) indicator.style.display = 'block';
}

/**
 * Resume the timer after pause.
 */
function resumeTimer() {
  if (_isFrozen) return;
  _isPaused = false;
  const indicator = document.getElementById('pause-indicator');
  if (indicator) indicator.style.display = 'none';
}

/**
 * Freeze the timer permanently (called when session completes or expires).
 * Saves final value to session.
 */
function freezeTimer() {
  _isFrozen = true;
  _isPaused = false;
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  _saveTime();
}

/**
 * Called when timer reaches 0:00.
 * Fills skipped packages, navigates to debrief.
 */
function onTimerExpired() {
  freezeTimer();
  fillSkipped();
  const session = getSession();
  if (session) {
    session.phase = 'debrief';
    saveSession(session);
  }
  window.location.href = 'debrief.html';
}
