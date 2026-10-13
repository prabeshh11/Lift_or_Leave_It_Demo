'use strict';

/*
  PACKAGE_POOL --- isShelf:true = must spawn on a shelf, false = floor.
  positionLabel/positionHeight are now scenario-narrative only (shown in inspect panel)
  and always match the actual spawn position type.
*/
const PACKAGE_POOL = [
  {
    id: 'pkg-01', name: 'Box of Office Supplies', weight: '5 kg',
    isShelf: true,
    shape: 'Regular box, easy grip handles',
    bestTechnique: 'solo', goodTechnique: 'team', wrongTechnique: 'trolley',
    feedbackBest:  'Correct. At 5 kg with good grip handles on a shelf, a solo lift is ideal.',
    feedbackGood:  'Works safely but unnecessary. A 5 kg box does not require two people.',
    feedbackWrong: 'Injury risk. Loading a light box onto a trolley creates extra bending movements.',
    bodyZoneWrong: 'lower-back',
    boxShape: 'box', boxColor: '#C4A060',
    boxDimensions: { w: 0.48, h: 0.42, d: 0.48 }
  },
  {
    id: 'pkg-02', name: 'Engine Block Crate', weight: '35 kg',
    isShelf: false,
    shape: 'Bulky, hard to grip, no handles',
    bestTechnique: 'trolley', goodTechnique: 'team', wrongTechnique: 'solo',
    feedbackBest:  'Correct. 35 kg is above the safe solo limit. A trolley removes all spinal load.',
    feedbackGood:  'Two people can manage this safely, but a trolley is the right tool for 35 kg.',
    feedbackWrong: 'Serious injury risk. 35 kg is well above safe solo lift limits. Lumbar disc injury likely.',
    bodyZoneWrong: 'lower-back',
    boxShape: 'box', boxColor: '#5C4A38',
    boxDimensions: { w: 1.1, h: 0.95, d: 1.1 }
  },
  {
    id: 'pkg-03', name: 'Stock Box (Tight Corner)', weight: '12 kg',
    isShelf: true,
    shape: 'Regular box, moderate weight',
    bestTechnique: 'team', goodTechnique: 'trolley', wrongTechnique: 'solo',
    feedbackBest:  'Correct. On a low or awkward shelf, one person steadies while the other lifts - removes the spinal twist.',
    feedbackGood:  'A trolley works but is harder to position near a shelf.',
    feedbackWrong: 'Injury risk. Twisting the spine while lifting from a shelf puts severe strain on lumbar discs.',
    bodyZoneWrong: 'spine-twist',
    boxShape: 'box', boxColor: '#B89050',
    boxDimensions: { w: 0.65, h: 0.55, d: 0.65 }
  },
  {
    id: 'pkg-04', name: 'Stack of Flat Panels', weight: '22 kg',
    isShelf: false,
    shape: 'Long, flat, unwieldy - no good grip point',
    bestTechnique: 'team', goodTechnique: 'trolley', wrongTechnique: 'solo',
    feedbackBest:  'Correct. Each person takes one end. Weight distributes evenly, back stays neutral.',
    feedbackGood:  'A flat-bed trolley works. Team lift is quicker and equally safe.',
    feedbackWrong: 'Injury risk. Long flat loads shift your centre of gravity, causing shoulder and lower-back strain.',
    bodyZoneWrong: 'shoulder',
    boxShape: 'flat', boxColor: '#708090',
    boxDimensions: { w: 1.6, h: 0.10, d: 0.68 }
  },
  {
    id: 'pkg-05', name: 'Tool Kit Case (High Shelf)', weight: '3 kg',
    isShelf: true,
    shape: 'Small case with handle, located above head height',
    bestTechnique: 'team', goodTechnique: 'trolley', wrongTechnique: 'solo',
    feedbackBest:  'Correct. One steadies below while the other retrieves safely. Prevents dangerous overhead reach.',
    feedbackGood:  'A step-platform trolley works, but team assist is quicker and safer.',
    feedbackWrong: 'Injury risk. Reaching overhead without support causes shoulder impingement and neck strain.',
    bodyZoneWrong: 'shoulder',
    boxShape: 'box', boxColor: '#6B7C46',
    boxDimensions: { w: 0.34, h: 0.22, d: 0.26 }
  },
  {
    id: 'pkg-06', name: 'Water Cooler Bottle', weight: '18 kg',
    isShelf: false,
    shape: 'Round, smooth - no handles, awkward to grip',
    bestTechnique: 'trolley', goodTechnique: 'team', wrongTechnique: 'solo',
    feedbackBest:  'Correct. A round smooth 18 kg object with no handle is exactly what a trolley is for.',
    feedbackGood:  'Two people can manage but gripping a smooth round bottle is awkward.',
    feedbackWrong: 'Injury risk. No handles and a round shape - high risk of dropping and wrist injury.',
    bodyZoneWrong: 'lower-back',
    boxShape: 'cylinder', boxColor: '#4A78BB',
    boxDimensions: { radius: 0.22, h: 1.1 }
  },
  {
    id: 'pkg-07', name: 'Spare Parts Crate', weight: '14 kg',
    isShelf: false,
    shape: 'Regular crate, side handles, wedged near a pillar',
    bestTechnique: 'team', goodTechnique: 'trolley', wrongTechnique: 'solo',
    feedbackBest:  'Correct. One guides from behind the obstacle, one receives - safe and efficient.',
    feedbackGood:  'Trolley works if there is clearance, but takes longer. Team lift is preferable.',
    feedbackWrong: 'Injury risk. Reaching behind an obstacle forces the spine into rotation under load.',
    bodyZoneWrong: 'spine-twist',
    boxShape: 'box', boxColor: '#6B6B50',
    boxDimensions: { w: 0.76, h: 0.65, d: 0.76 }
  },
  {
    id: 'pkg-08', name: 'Metal Filing Cabinet', weight: '28 kg',
    isShelf: false,
    shape: 'Tall, rectangular, smooth sides, no handles',
    bestTechnique: 'trolley', goodTechnique: 'team', wrongTechnique: 'solo',
    feedbackBest:  'Correct. A tall 28 kg object with no handles is designed to be moved by trolley.',
    feedbackGood:  'Two people can manage but gripping smooth sides strains fingers and wrists.',
    feedbackWrong: 'Injury risk. 28 kg with no handles and a tall centre of gravity - risk of toppling.',
    bodyZoneWrong: 'lower-back',
    boxShape: 'box', boxColor: '#8A8A9C',
    boxDimensions: { w: 0.72, h: 1.45, d: 0.52 }
  },
  {
    id: 'pkg-09', name: 'Archive Box (Low Shelf)', weight: '8 kg',
    isShelf: true,
    shape: 'Regular box, top carry handles, requires squatting',
    bestTechnique: 'solo', goodTechnique: 'team', wrongTechnique: 'trolley',
    feedbackBest:  'Correct. 8 kg with good top handles. Squat fully, grip handles, lift with legs.',
    feedbackGood:  'Works fine but two people for an 8 kg box is unnecessary.',
    feedbackWrong: 'Injury risk. Positioning a trolley under a low shelf is harder than lifting an 8 kg box correctly.',
    bodyZoneWrong: 'lower-back',
    boxShape: 'box', boxColor: '#C49A68',
    boxDimensions: { w: 0.58, h: 0.48, d: 0.52 }
  },
  {
    id: 'pkg-10', name: 'Delivery Pallet Box', weight: '10 kg',
    isShelf: false,
    shape: 'Regular square box, rope handles, open floor space',
    bestTechnique: 'solo', goodTechnique: 'team', wrongTechnique: 'trolley',
    feedbackBest:  'Correct. 10 kg, good handles, open space, floor level. Classic solo lift.',
    feedbackGood:  'Safe but unnecessarily uses two people for a 10 kg lift.',
    feedbackWrong: 'Injury risk. Loading a 10 kg box onto a trolley in open space creates more bending movements.',
    bodyZoneWrong: 'lower-back',
    boxShape: 'box', boxColor: '#A07858',
    boxDimensions: { w: 0.62, h: 0.57, d: 0.62 }
  }
];

/*
  POSITIONS --- y = TOP SURFACE of the shelf board, or 0 for floor.
  isShelf:true = on a shelf, false = floor level.
  New 5-level racking board tops: 0.59 / 1.39 / 2.19 / 2.99 / 3.79 m
  (board centre y + board_height/2 = level_centre + 0.04)
  Floor: y = 0
*/
const POSITIONS = [
  /* --- Shelf positions (isShelf:true) -- */
  { id: 'pos-01', isShelf: true,  coords: { x: -13.8, y: 3.79, z: -14.3 }, label: 'Back wall, top shelf (left)'    },
  { id: 'pos-02', isShelf: true,  coords: { x:   0.2, y: 3.79, z: -14.3 }, label: 'Back wall, top shelf (centre)'  },
  { id: 'pos-03', isShelf: true,  coords: { x:  13.8, y: 3.79, z: -14.3 }, label: 'Back wall, top shelf (right)'   },
  { id: 'pos-04', isShelf: true,  coords: { x: -14.6, y: 1.35, z:  -4.5 }, label: 'Left wall, mid shelf'           },
  { id: 'pos-05', isShelf: true,  coords: { x:  14.6, y: 0.59, z:  -4.5 }, label: 'Right wall, low shelf'          },
  /* --- Floor positions (isShelf:false) -- */
  { id: 'pos-06', isShelf: false, coords: { x:  -8.0, y: 0,    z:   0.0 }, label: 'Floor, centre-left open area'   },
  { id: 'pos-07', isShelf: false, coords: { x:   8.0, y: 0,    z:   0.0 }, label: 'Floor, centre-right open area'  },
  { id: 'pos-08', isShelf: false, coords: { x:   3.5, y: 0,    z:   3.5 }, label: 'Floor, beside central pillar'   },
  { id: 'pos-09', isShelf: false, coords: { x:  -7.0, y: 0,    z:   8.0 }, label: 'Floor, front-left zone'         },
  { id: 'pos-10', isShelf: false, coords: { x:   6.0, y: 0,    z:  10.0 }, label: 'Floor, near entrance'           }
];


function fisherYates(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a 5-package session.
 * Shelf packages always go to shelf positions; floor packages to floor positions.
 * Picks 2 shelf packages + 3 floor packages each run (shuffled within type).
 */
function buildSessionPackages() {
  const shelfPkgs  = fisherYates(PACKAGE_POOL.filter(p =>  p.isShelf)).slice(0, 2);
  const floorPkgs  = fisherYates(PACKAGE_POOL.filter(p => !p.isShelf)).slice(0, 3);
  const shelfPos   = fisherYates(POSITIONS.filter(p =>  p.isShelf)).slice(0, 2);
  const floorPos   = fisherYates(POSITIONS.filter(p => !p.isShelf)).slice(0, 3);

  const allPkgs    = fisherYates([...shelfPkgs, ...floorPkgs]);   // shuffle order so map order is random
  // Re-pair correctly by type
  let si = 0, fi = 0;
  return allPkgs.map(pkg => ({
    package:  pkg,
    position: pkg.isShelf ? shelfPos[si++] : floorPos[fi++]
  }));
}
