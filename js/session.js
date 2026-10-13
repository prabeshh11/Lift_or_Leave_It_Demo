'use strict';

const SESSION_KEY = 'lift_session';
let _sessionFallback = null;
let _usesFallback = false;

function _testStorage() {
  try {
    sessionStorage.setItem('_lol_test', '1');
    sessionStorage.removeItem('_lol_test');
    return true;
  } catch (e) {
    console.warn('[session] sessionStorage unavailable - falling back to in-memory variable.');
    _usesFallback = true;
    return false;
  }
}

_testStorage();

/**
 * Raw read from storage (returns parsed object or null)
 */
function _load() {
  if (_usesFallback) return _sessionFallback;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/**
 * Raw write to storage
 */
function _store(obj) {
  if (_usesFallback) {
    _sessionFallback = obj;
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
}

/**
 * Initialise a brand-new session and persist it.
 * Calls buildSessionPackages() from data.js.
 */
function initSession() {
  const sessionPkgs = buildSessionPackages();
  const session = {
    packages:        sessionPkgs,
    choices:         [],
    timeRemaining:   180,
    noInjuryBonus:   true,
    phase:           'play'
  };
  _store(session);
  return session;
}

/**
 * Return current session object (may return null if nothing stored).
 */
function getSession() {
  return _load();
}

/**
 * Persist the current session object.
 */
function saveSession(session) {
  _store(session);
}

/**
 * Record a technique choice for a package.
 * Determines outcome (best / good / wrong), builds ChoiceRecord, appends to SESSION.choices.
 * Sets noInjuryBonus=false if outcome is not 'best'.
 */
function recordChoice(packageId, technique) {
  const session = _load();
  if (!session) { console.error('[session] No session found when recording choice'); return null; }

  const assignment = session.packages.find(a => a.package.id === packageId);
  if (!assignment) { console.error('[session] Package not found:', packageId); return null; }

  const pkg = assignment.package;
  let outcome, points, feedbackText;

  if (technique === pkg.bestTechnique) {
    outcome      = 'best';
    points       = 10;
    feedbackText = pkg.feedbackBest;
  } else if (technique === pkg.goodTechnique) {
    outcome      = 'good';
    points       = 5;
    feedbackText = pkg.feedbackGood;
  } else {
    outcome      = 'wrong';
    points       = 0;
    feedbackText = pkg.feedbackWrong;
  }

  if (outcome !== 'best') {
    session.noInjuryBonus = false;
  }

  const record = {
    packageId,
    packageName:     pkg.name,
    positionLabel:   assignment.position.label,
    techniqueChosen: technique,
    outcome,
    points,
    feedbackText,
    bodyZoneWrong:   pkg.bodyZoneWrong
  };

  session.choices.push(record);
  _store(session);
  return record;
}

/**
 * Returns true if all 5 packages have been handled (choice recorded).
 */
function isSessionComplete() {
  const session = _load();
  if (!session) return false;
  return session.choices.length >= session.packages.length;
}

/**
 * Fill remaining packages as 'skipped' when timer expires.
 */
function fillSkipped() {
  const session = _load();
  if (!session) return;

  const completedIds = new Set(session.choices.map(c => c.packageId));
  session.packages.forEach(a => {
    if (!completedIds.has(a.package.id)) {
      session.choices.push({
        packageId:       a.package.id,
        packageName:     a.package.name,
        positionLabel:   a.position.label,
        techniqueChosen: null,
        outcome:         'skipped',
        points:          0,
        feedbackText:    'This package was not reached before the timer expired.',
        bodyZoneWrong:   a.package.bodyZoneWrong
      });
    }
  });
  session.noInjuryBonus = false;
  _store(session);
}

/**
 * Clear session storage entirely.
 */
function clearSession() {
  if (_usesFallback) { _sessionFallback = null; return; }
  sessionStorage.removeItem(SESSION_KEY);
}
