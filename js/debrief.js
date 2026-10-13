'use strict';

/**
 * Build the posture silhouette SVG for a result card.
 * @param {string} outcome      'best' | 'good' | 'wrong' | 'skipped'
 * @param {string} bodyZone     'lower-back' | 'shoulder' | 'spine-twist' | 'knee'
 * @returns {string}  SVG HTML string
 */
function buildPostureSVG(outcome, bodyZone) {
  const colors = {
    best: {
      stroke:  '#3B6D11',
      spine:   '#3B6D11',
      spineOp: '0.8',
      zone:    '#3B6D11'
    },
    good: {
      stroke:  '#BA7517',
      spine:   '#BA7517',
      spineOp: '0.8',
      zone:    '#BA7517'
    },
    wrong: {
      stroke:  '#A32D2D',
      spine:   '#A32D2D',
      spineOp: '0.9',
      zone:    '#A32D2D'
    },
    skipped: {
      stroke:  '#888888',
      spine:   '#888888',
      spineOp: '0.5',
      zone:    '#888888'
    }
  };

  const c = colors[outcome] || colors.skipped;

  // Zone highlight rectangles (x, y, width, height)
  const zoneRects = {
    'lower-back':  { x: 44, y: 48, w: 12, h: 12, label: 'Lower back strain' },
    'shoulder':    { x: 23, y: 28, w: 52, h: 10, label: 'Shoulder strain' },
    'spine-twist': { x: 44, y: 30, w: 12, h: 30, label: 'Spinal rotation' },
    'knee':        { x: 38, y: 65, w: 24, h: 14, label: 'Knee strain' }
  };

  const zone      = bodyZone && outcome === 'wrong' ? zoneRects[bodyZone] : null;
  const zoneLabel = zone ? zone.label : '';

  const zoneHtml = zone
    ? `<rect x="${zone.x}" y="${zone.y}" width="${zone.w}" height="${zone.h}" fill="${c.zone}" opacity="0.35" rx="2"/>`
    : '';

  return `
    <figure class="posture-figure" aria-label="Posture silhouette: ${outcome}${zoneLabel ? ' - ' + zoneLabel : ''}">
      <svg viewBox="0 0 100 120" width="100" height="120" role="img" aria-hidden="true">
        <!-- Head -->
        <circle cx="50" cy="15" r="10" stroke="${c.stroke}" stroke-width="2" fill="none"/>
        <!-- Torso -->
        <line x1="50" y1="25" x2="50" y2="65" stroke="${c.stroke}" stroke-width="2"/>
        <!-- Arms -->
        <line x1="50" y1="35" x2="25" y2="55" stroke="${c.stroke}" stroke-width="2"/>
        <line x1="50" y1="35" x2="75" y2="55" stroke="${c.stroke}" stroke-width="2"/>
        <!-- Legs -->
        <line x1="50" y1="65" x2="30" y2="95" stroke="${c.stroke}" stroke-width="2"/>
        <line x1="50" y1="65" x2="70" y2="95" stroke="${c.stroke}" stroke-width="2"/>
        <!-- Box -->
        <rect x="30" y="95" width="40" height="20" stroke="${c.stroke}" stroke-width="2" fill="rgba(255,255,255,0.1)"/>
        <!-- Spine highlight -->
        <rect x="47" y="25" width="6" height="40" fill="${c.spine}" opacity="${c.spineOp}"/>
        <!-- Injury zone highlight -->
        ${zoneHtml}
      </svg>
      ${zoneLabel ? `<figcaption class="zone-label">${zoneLabel}</figcaption>` : ''}
    </figure>
  `;
}

/**
 * Map technique string to human-readable label.
 */
function techniqueLabel(t) {
  if (t === 'solo')    return 'Solo Lift';
  if (t === 'team')    return 'Team Lift';
  if (t === 'trolley') return 'Use Trolley';
  return 'Not attempted';
}

/**
 * Map outcome string to badge HTML.
 */
function outcomeBadge(outcome) {
  const map = {
    best:    { cls: 'badge-best',    label: 'BEST'    },
    good:    { cls: 'badge-good',    label: 'GOOD'    },
    wrong:   { cls: 'badge-wrong',   label: 'WRONG'   },
    skipped: { cls: 'badge-skipped', label: 'SKIPPED' }
  };
  const o = map[outcome] || map.skipped;
  return `<span class="outcome-badge ${o.cls}">${o.label}</span>`;
}

/**
 * Render the debrief page content from SESSION data.
 */
function renderDebrief() {
  const session = getSession();
  if (!session || session.phase !== 'debrief') {
    window.location.href = 'index.html';
    return;
  }

  const techTotal    = calculateTechniqueTotal();
  const timeBonus    = calculateTimeBonus();
  const injuryBonus  = calculateNoInjuryBonus();
  const grandTotal   = calculateTotal();
  const passed       = isPassed();

  // Score badge in header
  const headerScore = document.getElementById('header-score');
  if (headerScore) headerScore.textContent = grandTotal;

  // Score summary blocks
  const techScoreEl   = document.getElementById('score-technique');
  const timeBonusEl   = document.getElementById('score-time');
  const injuryBonusEl = document.getElementById('score-injury');
  const grandTotalEl  = document.getElementById('score-grand');

  if (techScoreEl)   techScoreEl.textContent   = `${techTotal} / 50`;
  if (timeBonusEl)   timeBonusEl.textContent   = `${timeBonus} / 30`;
  if (injuryBonusEl) injuryBonusEl.textContent = `${injuryBonus} / 20`;
  if (grandTotalEl)  grandTotalEl.textContent  = grandTotal;

  // Time remaining display
  const timeLeftEl = document.getElementById('time-remaining-display');
  if (timeLeftEl) {
    timeLeftEl.textContent = formatTime(session.timeRemaining);
  }

  // Pass/fail banner
  const banner = document.getElementById('pass-fail-banner');
  if (banner) {
    if (passed) {
      banner.className = 'pass-fail-banner pass';
      banner.textContent = '✓ PASSED - well done!';
    } else {
      banner.className = 'pass-fail-banner fail';
      banner.textContent = '✗ NOT PASSED - score 60 to pass';
    }
  }

  // Result cards
  const cardsContainer = document.getElementById('result-cards');
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    session.choices.forEach((choice, index) => {
      const card = _buildResultCard(choice, index + 1);
      cardsContainer.appendChild(card);
    });
  }
}

/**
 * Build a single result card article element.
 */
function _buildResultCard(choice, num) {
  const article = document.createElement('article');
  article.className = `result-card result-card--${choice.outcome}`;
  article.setAttribute('aria-label', `Package ${num}: ${choice.packageName}`);

  article.innerHTML = `
    <div class="card-header-row">
      <h3 class="card-pkg-name">${choice.packageName}</h3>
      ${outcomeBadge(choice.outcome)}
    </div>
    <div class="card-meta-row">
      <span class="card-position">${choice.positionLabel}</span>
    </div>
    <div class="card-technique-row">
      You chose: <strong>${techniqueLabel(choice.techniqueChosen)}</strong>
    </div>
    <p class="card-feedback">${choice.feedbackText}</p>
    <div class="card-posture">
      ${buildPostureSVG(choice.outcome, choice.bodyZoneWrong)}
    </div>
  `;

  return article;
}
