'use strict';

let _currentPackageId   = null;
let _inspectOpen        = false;   // flag used by pause menu to suppress ESC conflict
let _autoCloseInterval  = null;    // polls distance while inspect is open

// ---- AUTO-CLOSE DISTANCE CHECK -------------------
const AUTO_CLOSE_RADIUS = 6.8;  // metres XZ - slightly beyond the 5 m proximity

function _startAutoClose() {
  _stopAutoClose();
  _autoCloseInterval = setInterval(function () {
    if (!_currentPackageId) { _stopAutoClose(); return; }
    if (typeof THREE === 'undefined') return;

    const cam = document.querySelector('[camera]');
    if (!cam) return;

    const pp = new THREE.Vector3();
    cam.object3D.getWorldPosition(pp);

    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session) return;

    const assignment = session.packages.find(a => a.package.id === _currentPackageId);
    if (!assignment) return;

    const p  = assignment.position.coords;
    const dx = pp.x - p.x;
    const dz = pp.z - p.z;
    if (Math.sqrt(dx * dx + dz * dz) > AUTO_CLOSE_RADIUS) {
      closeInspect();
      showToast('Moved too far - panel closed');
    }
  }, 300);
}

function _stopAutoClose() {
  if (_autoCloseInterval) { clearInterval(_autoCloseInterval); _autoCloseInterval = null; }
}

// --- OPEN INSPECT ------------------------------------------
function openInspect(packageId) {
  const session = getSession();
  if (!session) return;

  const assignment = session.packages.find(a => a.package.id === packageId);
  if (!assignment) return;

  _currentPackageId = packageId;
  _inspectOpen      = true;
  const pkg = assignment.package;
  const pos = assignment.position;

  // --- Populate fields ---------------------------------------
  const nameEl   = document.getElementById('inspect-package-name');
  const weightEl = document.getElementById('inspect-weight');
  const posEl    = document.getElementById('inspect-position');
  const shapeEl  = document.getElementById('inspect-shape');
  const htEl     = document.getElementById('inspect-position-height');

  if (nameEl)   nameEl.textContent   = pkg.name;
  if (weightEl) weightEl.textContent = pkg.weight;
  if (posEl)    posEl.textContent    = pos.label;
  if (shapeEl)  shapeEl.textContent  = pkg.shape;

  // Derive height label from actual spawn position (pos.coords.y = shelf surface)
  if (htEl) {
    const surfY = pos.coords.y;
    let heightLabel;
    if      (surfY === 0)    heightLabel = 'Floor level';
    else if (surfY < 0.8)    heightLabel = `Low shelf (${surfY.toFixed(2)} m)`;
    else if (surfY < 1.5)    heightLabel = `Mid shelf (${surfY.toFixed(2)} m)`;
    else                     heightLabel = `High shelf (${surfY.toFixed(2)} m)`;
    htEl.textContent = heightLabel;
  }

  // --- Release pointer lock so the player can use the mouse -------------
  const cam = document.querySelector('[camera]');
  if (cam) cam.setAttribute('look-controls', 'pointerLockEnabled: true; enabled: false');
  if (document.exitPointerLock) document.exitPointerLock();

  // Start distance-watcher - auto-close if player walks away
  _startAutoClose();

  // Slide panel in
  const panel = document.getElementById('inspect-panel');
  if (panel) {
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');
  }
}

// --- CLOSE INSPECT ----------------------------------------------
function closeInspect() {
  _stopAutoClose();   // always cancel the distance-watcher first

  const panel = document.getElementById('inspect-panel');
  if (panel) {
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('open');
  }

  // Re-enable look controls (player clicks canvas to re-lock pointer)
  const cam = document.querySelector('[camera]');
  if (cam) cam.setAttribute('look-controls', 'pointerLockEnabled: true; enabled: true');

  _currentPackageId = null;
  _inspectOpen      = false;
}

// --- TECHNIQUE CHOSEN ---------------------------------------
function onTechniqueClick(technique) {
  if (!_currentPackageId) return;
  const pkgId = _currentPackageId;

  pauseTimer();
  const choiceRecord = recordChoice(pkgId, technique);
  if (!choiceRecord) return;

  closeInspect();
  playAnimation(choiceRecord.outcome, pkgId);
}

// --- LEAVE IT (deliberate skip) --------------------------------------------
function onLeaveIt() {
  if (!_currentPackageId) return;
  const pkgId = _currentPackageId;

  closeInspect();
  skipPackage(pkgId, 'You chose to leave it. No points awarded - package counted as skipped.');
  enableControls();
}

// --- KEYBOARD ----------------------------------------------------
function initInspectKeyboard() {
  document.addEventListener('keydown', e => {
    // Open inspect with E (only when not in inspect and not paused)
    if (e.key === 'e' || e.key === 'E') {
      const panel = document.getElementById('inspect-panel');
      if (panel && panel.classList.contains('open')) return;
      const pauseOverlay = document.getElementById('pause-overlay');
      if (pauseOverlay && pauseOverlay.classList.contains('visible')) return;

      const near = getNearPackage();
      if (near) {
        openInspect(near);
      } else {
        showToast('Move closer to a package');
      }
    }

    // Escape key: close help panel → close inspect → show pause menu
    if (e.key === 'Escape') {
      // 1. If help panel is open, close it first
      const helpPanel = document.getElementById('help-panel');
      if (helpPanel && helpPanel.getAttribute('aria-hidden') === 'false') {
        if (typeof toggleHelpPanel === 'function') toggleHelpPanel();
        return;
      }
      // 2. If inspect is open, close it
      const panel = document.getElementById('inspect-panel');
      if (panel && panel.classList.contains('open')) {
        closeInspect();
        return;
      }
      // 3. Normal play → pause menu
      showPauseMenu();
    }
  });
}

// --- TOAST ----------------------------------------------------
function showToast(message) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 1500);
}
