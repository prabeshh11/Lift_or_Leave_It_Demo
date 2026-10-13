'use strict';

let _animationActive = false;

// Outcome colours and labels shown in the overlay
const OUTCOME_META = {
  best:  { color: '#3B6D11', bg: '#1B3A0F', icon: '✓', label: 'BEST TECHNIQUE!' },
  good:  { color: '#BA7517', bg: '#3D2A06', icon: '⚠', label: 'ACCEPTABLE TECHNIQUE' },
  wrong: { color: '#A32D2D', bg: '#3A0A0A', icon: '✗', label: 'RISKY TECHNIQUE!' }
};

/**
 * Staged animation:
 *   Phase 1 (0 → 1800ms) : Overlay visible, "Timer Paused" + package name + outcome badge shown.
 *                           No stick-figure animation yet, player reads context.
 *   Phase 2 (1800ms → 5800ms) : Stick-figure CSS animation plays (4 000ms).
 *   Phase 3 (5800ms) : Overlay hides, game resumes.
 */
function playAnimation(outcome, packageId) {
  _animationActive = true;
  disableControls();

  const overlay  = document.getElementById('anim-overlay');
  const svgWrap  = document.getElementById('stick-figure-wrapper');
  const pkgNameEl = document.getElementById('anim-pkg-name');
  const resultBadge = document.getElementById('anim-result-badge');
  const phaseLabel  = document.getElementById('anim-phase-label');

  // Gather session data for display
  const session    = getSession();
  const assignment = session ? session.packages.find(a => a.package.id === packageId) : null;
  const meta = OUTCOME_META[outcome] || OUTCOME_META.wrong;

  // Populate overlay text
  if (pkgNameEl && assignment) pkgNameEl.textContent = assignment.package.name;

  if (resultBadge) {
    resultBadge.textContent    = `${meta.icon}  ${meta.label}`;
    resultBadge.style.color    = meta.color;
    resultBadge.style.background = meta.bg;
  }

  if (phaseLabel) {
    phaseLabel.textContent = '⏸  Timer Paused ';
    phaseLabel.style.display = 'block';
  }

  // Ensure stick figure is hidden in phase 1
  if (svgWrap) {
    svgWrap.classList.remove('anim-best', 'anim-good', 'anim-wrong');
    svgWrap.style.opacity = '0';
    svgWrap.style.transition = 'opacity 0.4s ease';
  }

  // Show overlay
  if (overlay) {
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
  }

  // Phase 2: after 1800ms fade in stick figure & start animation 
  setTimeout(() => {
    if (svgWrap) {
      svgWrap.style.opacity = '1';
      void svgWrap.offsetWidth; // force reflow
      svgWrap.classList.add(`anim-${outcome}`);
    }
    if (phaseLabel) {
      phaseLabel.textContent = outcome === 'best' ? '✓ Correct technique - spine stays neutral'
                             : outcome === 'good' ? '⚠ Acceptable - but not optimal'
                             : '✗ Risk of injury - observe the strain zone';
    }
  }, 1800);

  // Phase 3: after 5800ms (1800 + 4000) hide overlay 
  setTimeout(() => {
    _hideOverlay(outcome, packageId);
  }, 5800);
}

function _hideOverlay(outcome, packageId) {
  _animationActive = false;

  const overlay = document.getElementById('anim-overlay');
  const svgWrap = document.getElementById('stick-figure-wrapper');

  if (overlay) {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (svgWrap) {
    svgWrap.classList.remove('anim-best', 'anim-good', 'anim-wrong');
    svgWrap.style.opacity = '0';
  }

  resumeTimer();
  markDone(packageId);

  if (isSessionComplete()) {
    freezeTimer();
    const session = getSession();
    if (session) { session.phase = 'debrief'; saveSession(session); }
    window.location.href = 'debrief.html';
    return;
  }

  enableControls();
}

function isAnimating() { return _animationActive; }
