'use strict';

let _proximityInterval  = null;
let _currentNearPackage = null;
let _completedPackages  = new Set();
let _sessionPackages    = [];
let _packageEntityMap   = {};

// --- MINIMAP CONSTANTS ------------------------------------------------
// Canvas rendered at 2× resolution, displayed at 1× via CSS for crispness
const MAP_RW = 400, MAP_RH = 320;   // canvas pixel dimensions
const WORLD_X0 = -22, WORLD_X1 = 22;
const WORLD_Z0 = -22, WORLD_Z1 = 16;
function _mx(x) { return (x - WORLD_X0) / (WORLD_X1 - WORLD_X0) * MAP_RW; }
function _mz(z) { return (z - WORLD_Z0) / (WORLD_Z1 - WORLD_Z0) * MAP_RH; }

// --- INIT -------------------------------------------------
function initWarehouse() {
  const session = getSession();
  if (!session) return;
  _sessionPackages = session.packages;
  _sessionPackages.forEach(a => _spawnPackage(a));
  _startProximityLoop();
}

// ---- SPAWN PACKAGE --------------------------------------------
function _spawnPackage(assignment) {
  const pkg   = assignment.package;
  const pos   = assignment.position.coords;  // pos.y = surface height (shelf board or 0 for floor)
  const dim   = pkg.boxDimensions;
  const color = pkg.boxColor || '#8B6914';
  const scene = document.querySelector('a-scene');
  if (!scene) return;

  // --- Main box geometry -----------------------------------------
  let box;
  let boxTopY;   // world Y of the top surface of the box

  if (pkg.boxShape === 'cylinder') {
    box = document.createElement('a-cylinder');
    box.setAttribute('radius', dim.radius);
    box.setAttribute('height', dim.h);
    // Center = surface + h/2  →  bottom sits on surface
    const cy = pos.y + dim.h / 2;
    box.setAttribute('position', `${pos.x} ${cy} ${pos.z}`);
    boxTopY = pos.y + dim.h;

    // Cap (bottle top)
    const cap = document.createElement('a-cylinder');
    cap.setAttribute('position', `0 ${dim.h / 2 + 0.04} 0`);
    cap.setAttribute('radius', dim.radius * 0.5);
    cap.setAttribute('height', '0.08');
    cap.setAttribute('color', '#CCDDEE');
    box.appendChild(cap);

  } else {
    const w = dim.w, h = dim.h, d = dim.d;
    box = document.createElement('a-box');
    box.setAttribute('width',  w);
    box.setAttribute('height', h);
    box.setAttribute('depth',  d);
    const cy = pos.y + h / 2;
    box.setAttribute('position', `${pos.x} ${cy} ${pos.z}`);
    boxTopY = pos.y + h;

    // --- Tape cross on top of box ------------------------------------
    const tape1 = document.createElement('a-box');
    tape1.setAttribute('position', `0 ${h / 2 + 0.005} 0`);
    tape1.setAttribute('width',  w * 1.01);
    tape1.setAttribute('height', '0.018');
    tape1.setAttribute('depth',  '0.055');
    tape1.setAttribute('color',  '#D8D0B0');
    box.appendChild(tape1);

    const tape2 = document.createElement('a-box');
    tape2.setAttribute('position', `0 ${h / 2 + 0.005} 0`);
    tape2.setAttribute('width',  '0.055');
    tape2.setAttribute('height', '0.018');
    tape2.setAttribute('depth',  d * 1.01);
    tape2.setAttribute('color',  '#D8D0B0');
    box.appendChild(tape2);

    // --- Label area on front face ------------------------------------
    const label3d = document.createElement('a-box');
    label3d.setAttribute('position', `0 0 ${d / 2 + 0.005}`);
    label3d.setAttribute('width',  w * 0.65);
    label3d.setAttribute('height', h * 0.55);
    label3d.setAttribute('depth',  '0.008');
    label3d.setAttribute('color',  '#EEEAD8');
    box.appendChild(label3d);

    // --- Weight stripe (coloured band on side by weight category) ----------
    // Light (<10kg)=teal, Medium(10-20kg)=amber, Heavy(>20kg)=red
    const wNum = parseFloat(pkg.weight);
    const stripeColor = wNum < 10 ? '#1A9E8E' : wNum <= 20 ? '#CC7E1A' : '#9E2020';
    const stripe = document.createElement('a-box');
    stripe.setAttribute('position', `${w / 2 + 0.005} 0 0`);
    stripe.setAttribute('width',  '0.008');
    stripe.setAttribute('height', h * 0.85);
    stripe.setAttribute('depth',  d * 1.01);
    stripe.setAttribute('color',  stripeColor);
    box.appendChild(stripe);

    // --- Filing cabinet: add drawer lines -------------------------------
    if (pkg.id === 'pkg-08') {
      for (let i = 0; i < 4; i++) {
        const drawer = document.createElement('a-box');
        drawer.setAttribute('position', `0 ${-h / 2 + 0.2 + i * 0.37} ${d / 2 + 0.006}`);
        drawer.setAttribute('width',  w * 0.95);
        drawer.setAttribute('height', '0.01');
        drawer.setAttribute('depth',  '0.008');
        drawer.setAttribute('color',  '#707088');
        box.appendChild(drawer);
      }
      const handle = document.createElement('a-box');
      handle.setAttribute('position', `0 0 ${d / 2 + 0.02}`);
      handle.setAttribute('width', '0.15');
      handle.setAttribute('height', '0.025');
      handle.setAttribute('depth', '0.025');
      handle.setAttribute('color', '#BBBBCC');
      box.appendChild(handle);
    }
  }

  // Slight random Y rotation for visual variety
  const rotY = (Math.random() * 14 - 7).toFixed(1);
  box.setAttribute('rotation', `0 ${rotY} 0`);
  box.setAttribute('color', color);
  box.setAttribute('data-id', pkg.id);

  // -- Floating torus marker -----------------------------------------
  const markerY = boxTopY + 0.55;
  const torus = document.createElement('a-torus');
  torus.setAttribute('position',       `${pos.x} ${markerY} ${pos.z}`);
  torus.setAttribute('radius',         '0.30');
  torus.setAttribute('radius-tubular', '0.05');
  torus.setAttribute('color',          '#FFD700');
  torus.setAttribute('data-role',      'marker');
  torus.setAttribute('animation',
    'property: rotation; to: 0 360 0; loop: true; dur: 2200; easing: linear');

  // -- Float animation on torus (bobs up and down) -------------------
  torus.setAttribute('animation__bob',
    `property: position; from: ${pos.x} ${markerY} ${pos.z}; ` +
    `to: ${pos.x} ${markerY + 0.18} ${pos.z}; ` +
    `dir: alternate; dur: 1400; loop: true; easing: easeInOutSine`);

  // -- Name label (above torus) ------------------------------------------
  const labelY = markerY + 0.72;
  const labelEntity = document.createElement('a-entity');
  labelEntity.setAttribute('position', `${pos.x} ${labelY} ${pos.z}`);
  labelEntity.setAttribute('look-at',  '[camera]');
  labelEntity.setAttribute('data-role', 'label');

  const bgPlane = document.createElement('a-plane');
  bgPlane.setAttribute('color',   '#0D1B2E');
  bgPlane.setAttribute('opacity', '0.90');
  bgPlane.setAttribute('width',   '1.85');
  bgPlane.setAttribute('height',  '0.30');

  const nameText = document.createElement('a-text');
  nameText.setAttribute('value',     pkg.name);
  nameText.setAttribute('color',     '#FFD700');
  nameText.setAttribute('align',     'center');
  nameText.setAttribute('width',     '1.75');
  nameText.setAttribute('position',  '0 0 0.015');
  nameText.setAttribute('wrap-count','30');

  const weightText = document.createElement('a-text');
  weightText.setAttribute('value',    pkg.weight);
  weightText.setAttribute('color',    '#88CCFF');
  weightText.setAttribute('align',    'center');
  weightText.setAttribute('width',    '0.8');
  weightText.setAttribute('position', '0 -0.22 0.015');

  labelEntity.appendChild(bgPlane);
  labelEntity.appendChild(nameText);
  labelEntity.appendChild(weightText);

  scene.appendChild(box);
  scene.appendChild(torus);
  scene.appendChild(labelEntity);

  _packageEntityMap[pkg.id] = { box, torus, labelEntity, doneMarker: null };

  // -- Register box footprint as a runtime collision obstacle -------------
  if (!window._dynamicObs) window._dynamicObs = [];
  var hw, hd;
  if (pkg.boxShape === 'cylinder') {
    hw = hd = (dim.radius || 0.25) + 0.14;
  } else {
    hw = ((dim.w || 0.5) / 2) + 0.12;
    hd = ((dim.d || 0.5) / 2) + 0.12;
  }
  window._dynamicObs.push({ cx: pos.x, cz: pos.z, hw: hw, hd: hd, pkgId: pkg.id });
}

// --- MARK DONE ------------------------------------------------
function markDone(packageId) {
  _completedPackages.add(packageId);
  const entities = _packageEntityMap[packageId];

  if (entities) {
    // Remove spinning yellow torus and name label
    [entities.torus, entities.labelEntity].forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });

    // -- Turn box green (immediate) then fade to translucent ---------------
    entities.box.setAttribute('color', '#1E7010');
    entities.box.setAttribute('emissive', '#0A3D06');
    entities.box.setAttribute('emissive-intensity', '0.35');
    entities.box.setAttribute('animation__green',
      'property: material.opacity; from: 1; to: 0.45; dur: 2800; easing: easeOutQuad; delay: 600');

    // -- Completion marker: green halo ring + DONE text badge ------------
    const pos = _getPackagePosition(packageId);
    if (pos) {
      const scene   = document.querySelector('a-scene');
      const pkg     = _sessionPackages.find(a => a.package.id === packageId).package;
      const dim     = pkg.boxDimensions;
      const boxTopY = pos.y + (pkg.boxShape === 'cylinder' ? dim.h : dim.h);
      const ringY   = boxTopY + 0.55;

      // Horizontal green ring (halo)
      const ring = document.createElement('a-torus');
      ring.setAttribute('position',       `${pos.x} ${ringY} ${pos.z}`);
      ring.setAttribute('rotation',       '90 0 0');
      ring.setAttribute('radius',         '0.30');
      ring.setAttribute('radius-tubular', '0.045');
      ring.setAttribute('color',          '#3BCC1A');
      ring.setAttribute('emissive',       '#1A6B08');
      ring.setAttribute('emissive-intensity', '0.5');
      ring.setAttribute('animation__float',
        `property: position; from: ${pos.x} ${ringY} ${pos.z}; ` +
        `to: ${pos.x} ${ringY + 0.22} ${pos.z}; ` +
        `dir: alternate; dur: 1600; loop: true; easing: easeInOutSine`);

      // ✓ DONE badge above ring
      const badge = document.createElement('a-entity');
      badge.setAttribute('position', `${pos.x} ${ringY + 0.65} ${pos.z}`);
      badge.setAttribute('look-at',  '[camera]');

      const badgeBg = document.createElement('a-plane');
      badgeBg.setAttribute('color',   '#0D2E10');
      badgeBg.setAttribute('opacity', '0.92');
      badgeBg.setAttribute('width',   '0.88');
      badgeBg.setAttribute('height',  '0.28');

      const badgeText = document.createElement('a-text');
      badgeText.setAttribute('value',     '✓  DONE');
      badgeText.setAttribute('color',     '#7CFF4A');
      badgeText.setAttribute('align',     'center');
      badgeText.setAttribute('width',     '0.82');
      badgeText.setAttribute('position',  '0 0 0.015');

      badge.appendChild(badgeBg);
      badge.appendChild(badgeText);

      scene.appendChild(ring);
      scene.appendChild(badge);
      entities.doneMarker = { ring, badge };
    }
  }

  // Update HUD counter
  const counter = document.getElementById('pkg-counter');
  if (counter) counter.textContent = `${_completedPackages.size} / 5 done`;

  _drawMinimap();
}

function _getPackagePosition(packageId) {
  const a = _sessionPackages.find(a => a.package.id === packageId);
  return a ? a.position.coords : null;
}

// --- SKIP PACKAGE (Leave It / End Early) ---------------------------------
/**
 * Record a single package as deliberately skipped (Leave It button).
 * Marks it done in the 3D scene, updates session, checks completion.
 * @param {string} packageId
 * @param {string} [feedbackText]
 */
function skipPackage(packageId, feedbackText) {
  const session = getSession();
  if (!session) return;

  const assignment = _sessionPackages.find(a => a.package.id === packageId);
  if (!assignment) return;

  // Record the skip choice
  session.choices.push({
    packageId:       packageId,
    packageName:     assignment.package.name,
    positionLabel:   assignment.position.label,
    techniqueChosen: 'leave',
    outcome:         'skipped',
    points:          0,
    feedbackText:    feedbackText || 'Package skipped.',
    bodyZoneWrong:   null
  });
  // Skipping forfeits the no-injury bonus
  session.noInjuryBonus = false;
  saveSession(session);

  // Mark the box done (greyed out in scene) with SKIP appearance
  _completedPackages.add(packageId);
  const entities = _packageEntityMap[packageId];
  if (entities) {
    // Remove spinning markers
    [entities.torus, entities.labelEntity].forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    // Grey-out box to signal skipped
    entities.box.setAttribute('color', '#555555');
    entities.box.setAttribute('emissive', '#222222');
    entities.box.setAttribute('emissive-intensity', '0.2');
    entities.box.setAttribute('animation__grey',
      'property: material.opacity; from: 1; to: 0.35; dur: 1800; easing: easeOutQuad');
  }

  const counter = document.getElementById('pkg-counter');
  if (counter) counter.textContent = `${_completedPackages.size} / 5 done`;
  _drawMinimap();

  // Check if all 5 packages handled
  if (_completedPackages.size >= _sessionPackages.length) {
    freezeTimer();
    session.phase = 'debrief';
    saveSession(session);
    setTimeout(() => { window.location.href = 'debrief.html'; }, 600);
  }
}

/**
 * Fill ALL remaining unhandled packages as skipped, set phase=debrief.
 * Called when player chooses "End Session" early.
 * @param {string} [reason]
 */
function fillSkippedEarly(reason) {
  const session = getSession();
  if (!session) return;

  const handled = new Set(session.choices.map(c => c.packageId));
  session.packages.forEach(a => {
    if (!handled.has(a.package.id)) {
      session.choices.push({
        packageId:       a.package.id,
        packageName:     a.package.name,
        positionLabel:   a.position.label,
        techniqueChosen: 'leave',
        outcome:         'skipped',
        points:          0,
        feedbackText:    reason || 'Session ended early - package not handled.',
        bodyZoneWrong:   null
      });
      session.noInjuryBonus = false;
    }
  });
  session.phase = 'debrief';
  saveSession(session);
}

/**
 * Original fillSkipped - used by timer expiry.
 */
function fillSkipped() {
  fillSkippedEarly('Time expired - package not handled.');
}

// --- PROXIMITY LOOP ----------------------------------------------
function _startProximityLoop() {
  if (_proximityInterval) clearInterval(_proximityInterval);
  _proximityInterval = setInterval(_checkProximity, 200);
}

function _checkProximity() {
  const cam = document.querySelector('[camera]');
  if (!cam) return;
  const pp = new THREE.Vector3();
  cam.object3D.getWorldPosition(pp);

  let nearest = null, nearestDist = Infinity;
  _sessionPackages.forEach(a => {
    if (_completedPackages.has(a.package.id)) return;
    const p = a.position.coords;
    // Use 2D (XZ only) distance so high-shelf packages are reachable from below.
    // A 5 m radius lets the player stand in the aisle and inspect any shelf level.
    const dx  = pp.x - p.x;
    const dz  = pp.z - p.z;
    const d2D = Math.sqrt(dx * dx + dz * dz);
    if (d2D < 5.0 && d2D < nearestDist) { nearestDist = d2D; nearest = a.package.id; }
  });

  const prompt = document.getElementById('proximity-prompt');
  _currentNearPackage = nearest;
  if (prompt) prompt.classList.toggle('visible', !!nearest);

  _drawMinimap();
}

function getNearPackage() { return _currentNearPackage; }
function getDoneCount()   { return _completedPackages.size; }

// --- CONTROLS ----------------------------------------------------------
function disableControls() {
  const cam = document.querySelector('[camera]');
  if (!cam) return;
  cam.setAttribute('wasd-controls', 'acceleration: 30; fly: false; enabled: false');
  cam.setAttribute('look-controls',  'pointerLockEnabled: true; enabled: false');
}

function enableControls() {
  const cam = document.querySelector('[camera]');
  if (!cam) return;
  cam.setAttribute('wasd-controls', 'acceleration: 30; fly: false; enabled: true');
  cam.setAttribute('look-controls',  'pointerLockEnabled: true; enabled: true');
}

// --- MINIMAP -------------------------------------------
function _drawMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, MAP_RW, MAP_RH);

  const S = MAP_RW / (WORLD_X1 - WORLD_X0); // pixels per world unit

  // --- Floor fill ----------------------------------------------------
  ctx.fillStyle = '#141B26';
  ctx.fillRect(0, 0, MAP_RW, MAP_RH);

  // --- Faint grid lines (every 5 world units) --------------------
  ctx.strokeStyle = 'rgba(60,80,110,0.35)';
  ctx.lineWidth   = 1;
  for (let wx = WORLD_X0; wx <= WORLD_X1; wx += 5) {
    const cx = _mx(wx);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, MAP_RH); ctx.stroke();
  }
  for (let wz = WORLD_Z0; wz <= WORLD_Z1; wz += 5) {
    const cy = _mz(wz);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(MAP_RW, cy); ctx.stroke();
  }

  // --- Floor safety stripes (matches game.html yellow lines) -----------
  const stripeColor = 'rgba(160,135,20,0.55)';
  ctx.strokeStyle = stripeColor;
  ctx.lineWidth   = 2;
  // Centre lane stripe (z-direction at x=0, x=±17)
  [[0], [-17], [17]].forEach(([wx]) => {
    const cx = _mx(wx);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, MAP_RH); ctx.stroke();
  });
  // Cross-aisle at z=8
  ctx.beginPath(); ctx.moveTo(0, _mz(8)); ctx.lineTo(MAP_RW, _mz(8)); ctx.stroke();

  // --- Shelving units (filled + outlined) -------------------------
  ctx.fillStyle   = '#2E3D52';
  ctx.strokeStyle = '#4A6480';
  ctx.lineWidth   = 2;

  function drawRect(wx1, wz1, wx2, wz2) {
    const x = _mx(wx1), y = _mz(wz1), w = _mx(wx2) - x, h = _mz(wz2) - y;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  // Back shelves (3 units at z≈-14.2)
  drawRect(-15.9, -15.0, -12.1, -13.2);
  drawRect( -1.9, -15.0,   2.1, -13.2);
  drawRect( 12.1, -15.0,  15.9, -13.2);

  // Left wall shelf
  drawRect(-15.0,  -8.5, -13.5,   0.5);
  // Right wall shelf
  drawRect( 13.5,  -8.5,  15.0,   0.5);

  // Centre-floor island shelf (added in game.html)
  drawRect( -3.5, -10.0,   3.5,  -8.0);

  // Raised platform
  ctx.fillStyle   = '#252C1E';
  ctx.strokeStyle = '#3A4530';
  drawRect(  5.5, -13.0,  14.5,  -5.0);

  // --- Columns (small dark squares) ------------------------------
  ctx.fillStyle   = '#3A4555';
  ctx.strokeStyle = '#5A6A80';
  ctx.lineWidth   = 1.5;
  [
    [-18, -16], [18, -16], [-18, -7], [18, -7], [-18, 2], [18, 2],
    [2, 3]  // central pillar
  ].forEach(([cx, cz]) => {
    const px = _mx(cx) - 5, py = _mz(cz) - 5;
    ctx.fillRect(px, py, 10, 10);
    ctx.strokeRect(px, py, 10, 10);
  });

  // --- Loading bay openings (front wall) ------------------------
  ctx.fillStyle = '#050810';
  ctx.fillRect(_mx(-7.5), _mz(14.5), _mx(-2.5) - _mx(-7.5), MAP_RH - _mz(14.5));
  ctx.fillRect(_mx( 2.5), _mz(14.5), _mx( 7.5) - _mx( 2.5), MAP_RH - _mz(14.5));

  // --- Forklift -----------------------------------------
  ctx.fillStyle = '#5A4010';
  drawRect(-13.5, 10.0, -10.5, 14.0);

  // --- Barrel group --------------------------------------------
  ctx.fillStyle = '#203820';
  ctx.strokeStyle = '#355535';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(_mx(-15), _mz(4), 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // --- Workbench ----------------------------------------------------------
  ctx.fillStyle = '#2E2010';
  ctx.strokeStyle = '#4A3A20';
  ctx.lineWidth = 1.5;
  drawRect(14.0, -3.5, 19.5, -1.0);

  // --- Warehouse outer wall ---------------------------------------------------
  ctx.strokeStyle = '#6A8AAA';
  ctx.lineWidth   = 4;
  ctx.strokeRect(2, 2, MAP_RW - 4, MAP_RH - 4);

  // --- Package icons -----------------------------------------------------------
  _sessionPackages.forEach(a => {
    const id   = a.package.id;
    const p    = a.position.coords;
    const cx   = _mx(p.x);
    const cy   = _mz(p.z);
    const done = _completedPackages.has(id);

    if (done) {
      // Green filled circle with ✓ stroke
      ctx.fillStyle   = '#28961A';
      ctx.strokeStyle = '#7CFF4A';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // ✓ checkmark
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 1);
      ctx.lineTo(cx - 1, cy + 5);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.stroke();
    } else {
      // Gold pulsing dot - outer glow
      ctx.fillStyle = 'rgba(255,200,0,0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      // Main dot
      ctx.fillStyle   = '#FFD700';
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // Package index number
      ctx.fillStyle    = '#1A1200';
      ctx.font         = 'bold 11px sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      const idx = _sessionPackages.findIndex(x => x.package.id === id);
      ctx.fillText(String(idx + 1), cx, cy);
    }
  });

  // --- Player arrow ------------------------------------
  const cam = document.querySelector('[camera]');
  if (cam) {
    const wp = new THREE.Vector3();
    cam.object3D.getWorldPosition(wp);
    const px = _mx(wp.x);
    const py = _mz(wp.z);

    // Camera Y rotation: 0 = looking toward -Z = toward top of map
    const ry = cam.object3D.rotation.y;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-ry);

    // Outer glow
    ctx.shadowColor = '#00CCFF';
    ctx.shadowBlur  = 12;
    // Arrow body
    ctx.fillStyle   = '#00BFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(  0, -13);  // tip
    ctx.lineTo( -7,   8);
    ctx.lineTo(  0,   3);
    ctx.lineTo(  7,   8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
