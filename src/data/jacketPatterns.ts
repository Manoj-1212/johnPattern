// ─────────────────────────────────────────────
//  Jacket Pattern Drafting Functions
//  All coordinates in cm. 1 unit = 1 cm.
//  Y+ is downward (SVG convention).
//  Each piece is drafted with its own origin at (0,0).
//
//  Based on: Phase 1 — Jacket (L-size is the master base)
// ─────────────────────────────────────────────

import type { BodyMeasurements } from '../types/measurements.types';
import type { PatternPiece, PatternKeyPoint } from '../types/pattern.types';
import { JACKET_EASE } from './standardSizes';
import { fmtPt } from '../utils/patternMath';
import type { Vec2 } from '../utils/patternMath';
import type { JacketStyleOptions } from '../types/style.types';

type Ease = typeof JACKET_EASE;

// ── Helpers ─────────────────────────────────

/** Quarter of a circumference + ease */
const q4 = (circ: number, ease: number) => (circ + ease) / 4;

/** Half of a circumference + ease */
const h2 = (circ: number, ease: number) => (circ + ease) / 2;

// ─────────────────────────────────────────────
//  1. FRONT BODY PANEL
//  (Left panel — from center front to side seam)
// ─────────────────────────────────────────────
export function draftFrontPanel(m: BodyMeasurements, ease: Ease, style?: JacketStyleOptions): PatternPiece {
  // ── X positions (from CF = 0, measured rightward) ──
  const nw = m.neck / 5;                     // front neck width (CF to shoulder-neck pt)
  const shoulderX = m.shoulderWidth / 2;     // shoulder point X
  const chestX = q4(m.chest, ease.chest);    // side seam X at armhole
  const waistX = q4(m.waist, ease.waist);    // side seam X at waist
  const hipX   = q4(m.hips,  ease.hips);     // side seam X at hip

  // ── Y positions (from HPS = 0, measured downward) ──
  const nd       = m.neck / 6 + 1;           // front neck depth
  const Y_ah     = m.armholeDepth;            // armhole / underarm level
  const Y_waist  = m.backLength;              // waist line
  const Y_hip    = m.backLength + 18;         // hip line (18 cm below waist)
  const Y_hem    = m.jacketLength;            // jacket hem

  // ── Named vertices ──
  const SNP: Vec2  = [nw,         0];          // Shoulder Neck Point
  const SP:  Vec2  = [shoulderX,  1.5];        // Shoulder Point (1.5cm drop)
  const AHB: Vec2  = [chestX,     Y_ah];       // Armhole Bottom (underarm)
  const SW:  Vec2  = [waistX,     Y_waist];    // Side seam at Waist
  const SH:  Vec2  = [hipX,       Y_hip];      // Side seam at Hip
  const SHM: Vec2  = [hipX,       Y_hem];      // Side seam at Hem
  // Style: double-breasted adds ~5 cm button extension beyond CF
  const btnStyle   = style?.buttonConfig?.style;
  const isDoubleBr = btnStyle === 'double_breasted_4btn' || btnStyle === 'double_breasted_6btn';
  const cfExt      = isDoubleBr ? 5 : 0;

  const FHC: Vec2  = [nw - 2 - cfExt, Y_hem + 2];      // Front Hem Corner
  const CFW: Vec2  = [-cfExt,          Y_waist + 2];    // Button extension / CF edge
  const FNP: Vec2  = [0,               nd];              // Front Neck Point (stays at CF)

  // ── Bezier control points ──
  // Armhole: from SP down to AHB (concave shoulder scoop, then convex lower)
  const AH_c1: Vec2 = [shoulderX + 1,   9];
  const AH_c2: Vec2 = [chestX - 2,      Y_ah - 5];

  // Upper neckline: SNP → FNP (concave curve inward)
  const NK_c1: Vec2 = [nw * 0.55,  nd * 0.15];
  const NK_c2: Vec2 = [nw * 0.15,  nd * 0.65];

  const svgPath = [
    `M ${fmtPt(SNP)}`,
    `L ${fmtPt(SP)}`,
    `C ${fmtPt(AH_c1)} ${fmtPt(AH_c2)} ${fmtPt(AHB)}`,
    `L ${fmtPt(SW)}`,
    `L ${fmtPt(SH)}`,
    `L ${fmtPt(SHM)}`,
    `L ${fmtPt(FHC)}`,
    `L ${fmtPt(CFW)}`,
    `L ${fmtPt(FNP)}`,
    `C ${fmtPt(NK_c2)} ${fmtPt(NK_c1)} ${fmtPt(SNP)}`,
    'Z',
  ].join(' ');

  const keyPoints: PatternKeyPoint[] = [
    { id: 'snp',          x: SNP[0],  y: SNP[1],  linkedMeasurement: 'neck',          adjustmentAxis: 'x' },
    { id: 'sp',           x: SP[0],   y: SP[1],   linkedMeasurement: 'shoulderWidth', adjustmentAxis: 'x' },
    { id: 'ahb_x',        x: AHB[0],  y: AHB[1],  linkedMeasurement: 'chest',         adjustmentAxis: 'x' },
    { id: 'ahb_y',        x: AHB[0],  y: AHB[1],  linkedMeasurement: 'armholeDepth',  adjustmentAxis: 'y' },
    { id: 'sw',           x: SW[0],   y: SW[1],   linkedMeasurement: 'waist',         adjustmentAxis: 'both' },
    { id: 'sh',           x: SH[0],   y: SH[1],   linkedMeasurement: 'hips',          adjustmentAxis: 'x' },
    { id: 'hem',          x: SHM[0],  y: SHM[1],  linkedMeasurement: 'jacketLength',  adjustmentAxis: 'y' },
    { id: 'backLength',   x: SW[0],   y: SW[1],   linkedMeasurement: 'backLength',    adjustmentAxis: 'y' },
  ];

  return {
    id: 'jacket_front',
    name: isDoubleBr ? 'Front Panel (Double Breasted)' : 'Front Panel',
    baseSize: 'L',
    svgPath,
    grainLine: { x1: 4, y1: Y_ah + 4,  x2: 4, y2: Y_hem - 8 },
    keyPoints,
    seamAllowance: 1.5,
  };
}

// ─────────────────────────────────────────────
//  2. BACK BODY PANEL
//  (From center back to side seam, with center vent)
// ─────────────────────────────────────────────
export function draftBackPanel(m: BodyMeasurements, ease: Ease, style?: JacketStyleOptions): PatternPiece {
  // ── X positions ──
  const bnw      = m.neck / 6;                // back neck width (CB to BNP)
  const shoulderX = m.shoulderWidth / 2;       // shoulder point
  const chestX   = q4(m.chest, ease.chest);   // side seam at chest
  const waistX   = q4(m.waist, ease.waist);   // side seam at waist
  const hipX     = q4(m.hips,  ease.hips);    // side seam at hip

  // ── Y positions ──
  const bnd      = 2;                          // back neck depth (shallow)
  const Y_ah     = m.armholeDepth;
  const Y_waist  = m.backLength;
  const Y_hip    = m.backLength + 18;
  const Y_hem    = m.jacketLength;
  const Y_vent   = Y_hem - 15;                 // center vent opens 15 cm from hem

  // ── Named vertices ──
  const CBS:  Vec2 = [0,          0];           // Center Back at Shoulder
  const BNP:  Vec2 = [bnw,        bnd];         // Back Neck Point (at center-ish)
  const SP:   Vec2 = [shoulderX,  2];           // Shoulder Point (2cm drop, back is less)
  const AHB:  Vec2 = [chestX,     Y_ah];        // Armhole Bottom
  const SW:   Vec2 = [waistX,     Y_waist];     // Side seam Waist
  const SH:   Vec2 = [hipX,       Y_hip];       // Side seam Hip
  const SHM:  Vec2 = [hipX,       Y_hem];       // Side seam Hem
  // ── Bezier control points ──
  // Armhole (back): deeper concave under shoulder blade
  const AH_c1: Vec2 = [shoulderX + 1,  8];
  const AH_c2: Vec2 = [chestX - 1.5,   Y_ah - 5];

  // Back neckline: BNP → CBS (very shallow arc)
  const BN_c1: Vec2 = [bnw * 0.4,  bnd * 0.5];
  const BN_c2: Vec2 = [0.5,        bnd * 0.8];

  // Style-driven: back hem / vent shape
  const ventStyle = style?.backVent ?? 'center_vent';
  let ventTail: string[];
  if (ventStyle === 'no_vent') {
    const cbHem: Vec2 = [0, Y_hem];
    ventTail = [`L ${fmtPt(SHM)}`, `L ${fmtPt(cbHem)}`, `L ${fmtPt(CBS)}`];
  } else if (ventStyle === 'side_vents') {
    // Vent opens at the side seam; must start AT or BELOW the hip point
    const Y_ventSide = Math.max(Y_hip, Y_vent);
    const sStart: Vec2 = [hipX,     Y_ventSide];
    const sExt:   Vec2 = [hipX + 4, Y_ventSide];
    const sBot:   Vec2 = [hipX + 4, Y_hem];
    const cbHem:  Vec2 = [0,        Y_hem];
    ventTail = [
      `L ${fmtPt(sStart)}`, `L ${fmtPt(sExt)}`, `L ${fmtPt(sBot)}`,
      `L ${fmtPt(cbHem)}`,  `L ${fmtPt(CBS)}`,
    ];
  } else {
    // center_vent (default)
    const HEM:  Vec2 = [4, Y_hem];
    const VHEM: Vec2 = [4, Y_vent];
    const CBV:  Vec2 = [0, Y_vent];
    ventTail = [
      `L ${fmtPt(SHM)}`, `L ${fmtPt(HEM)}`, `L ${fmtPt(VHEM)}`,
      `L ${fmtPt(CBV)}`, `L ${fmtPt(CBS)}`,
    ];
  }

  const svgPath = [
    `M ${fmtPt(CBS)}`,
    `C ${fmtPt(BN_c2)} ${fmtPt(BN_c1)} ${fmtPt(BNP)}`,
    `L ${fmtPt(SP)}`,
    `C ${fmtPt(AH_c1)} ${fmtPt(AH_c2)} ${fmtPt(AHB)}`,
    `L ${fmtPt(SW)}`,
    `L ${fmtPt(SH)}`,
    ...ventTail,
    'Z',
  ].join(' ');

  const keyPoints: PatternKeyPoint[] = [
    { id: 'bnp',         x: BNP[0],  y: BNP[1], linkedMeasurement: 'neck',          adjustmentAxis: 'x' },
    { id: 'sp',          x: SP[0],   y: SP[1],  linkedMeasurement: 'shoulderWidth', adjustmentAxis: 'x' },
    { id: 'ahb_x',       x: AHB[0],  y: AHB[1], linkedMeasurement: 'chest',         adjustmentAxis: 'x' },
    { id: 'ahb_y',       x: AHB[0],  y: AHB[1], linkedMeasurement: 'armholeDepth',  adjustmentAxis: 'y' },
    { id: 'sw',          x: SW[0],   y: SW[1],  linkedMeasurement: 'waist',         adjustmentAxis: 'both' },
    { id: 'sh',          x: SH[0],   y: SH[1],  linkedMeasurement: 'hips',          adjustmentAxis: 'x' },
    { id: 'hem',         x: SHM[0],  y: SHM[1], linkedMeasurement: 'jacketLength',  adjustmentAxis: 'y' },
    { id: 'backLength',  x: SW[0],   y: SW[1],  linkedMeasurement: 'backLength',    adjustmentAxis: 'y' },
  ];

  return {
    id: 'jacket_back',
    name: ventStyle === 'side_vents' ? 'Back Panel (Side Vents)'
        : ventStyle === 'no_vent'    ? 'Back Panel (No Vent)'
        : 'Back Panel (Center Vent)',
    baseSize: 'L',
    svgPath,
    grainLine: { x1: 3, y1: Y_ah + 4, x2: 3, y2: Y_hem - 10 },
    keyPoints,
    seamAllowance: 1.5,
  };
}

// ─────────────────────────────────────────────
//  3. SLEEVE — UPPER
//  (The larger sleeve piece with cap curve)
// ─────────────────────────────────────────────
export function draftSleeveUpper(m: BodyMeasurements, ease: Ease, style?: JacketStyleOptions): PatternPiece {
  const uaHalf  = h2(m.upperArmCircumference, ease.upperArmCircumference) / 2;
  const elHalf  = m.elbowCircumference / 2;
  const wrHalf  = m.wristCircumference / 2;

  const capH    = 15;                         // sleeve cap height (cm)
  const Y_total = capH + m.sleeveLength;       // total piece height
  const Y_elbow = capH + m.sleeveLength * 0.55; // elbow level
  const capTopX = uaHalf * 0.58;              // cap apex X (slightly off-center back)

  // ── Named vertices ──
  const CAP:  Vec2 = [capTopX,           0];
  const BK_N: Vec2 = [uaHalf * 1.95,     capH * 0.65];  // back notch on cap
  const BK_U: Vec2 = [uaHalf * 2,        capH];          // back underarm
  const BK_E: Vec2 = [uaHalf * 2 + 0.5,  Y_elbow];       // back elbow (slight flare)
  const BK_W: Vec2 = [uaHalf * 2 - 1,    Y_total];       // back wrist
  const FR_W: Vec2 = [uaHalf * 2 - 1 - wrHalf * 2 + 2, Y_total];  // front wrist
  const FR_E: Vec2 = [uaHalf * 2 - elHalf * 2 + 2,     Y_elbow];  // front elbow
  const FR_U: Vec2 = [0,                 capH];           // front underarm
  const FR_N: Vec2 = [uaHalf * 0.08,    capH * 0.55];   // front notch on cap

  // ── Bezier control points ──
  // Cap curve: FR_U → FR_N → CAP → BK_N → BK_U (smooth "hat" shape)
  const CAP_FR_c1: Vec2 = [FR_U[0],      capH * 0.25];
  const CAP_FR_c2: Vec2 = [FR_N[0],      capH * 0.35];
  const CAP_BK_c1: Vec2 = [capTopX + 2,  capH * 0.05];
  const CAP_BK_c2: Vec2 = [BK_N[0] - 1,  capH * 0.45];
  const CAP_UN_c1: Vec2 = [BK_N[0] + 0.5, capH * 0.75];
  const CAP_UN_c2: Vec2 = [BK_U[0] - 1,    capH - 1];

  const svgPath = [
    `M ${fmtPt(CAP)}`,
    // Cap front side: CAP → FR_N → FR_U
    `C ${fmtPt(CAP_FR_c1)} ${fmtPt(CAP_FR_c2)} ${fmtPt(FR_N)}`,
    `L ${fmtPt(FR_U)}`,
    // Front seam: FR_U down to FR_W
    `L ${fmtPt(FR_E)}`,
    `L ${fmtPt(FR_W)}`,
    // Wrist hem
    `L ${fmtPt(BK_W)}`,
    // Back seam: BK_W up to BK_U
    `L ${fmtPt(BK_E)}`,
    `L ${fmtPt(BK_U)}`,
    // Cap back side: BK_U → BK_N → CAP
    `C ${fmtPt(CAP_UN_c1)} ${fmtPt(CAP_UN_c2)} ${fmtPt(BK_N)}`,
    `C ${fmtPt(CAP_BK_c1)} ${fmtPt(CAP_BK_c2)} ${fmtPt(CAP)}`,
    'Z',
  ].join(' ');

  const keyPoints: PatternKeyPoint[] = [
    { id: 'cap',          x: CAP[0],   y: CAP[1],   linkedMeasurement: 'upperArmCircumference', adjustmentAxis: 'x' },
    { id: 'bk_underarm',  x: BK_U[0],  y: BK_U[1],  linkedMeasurement: 'upperArmCircumference', adjustmentAxis: 'x' },
    { id: 'fr_underarm',  x: FR_U[0],  y: FR_U[1],  linkedMeasurement: 'upperArmCircumference', adjustmentAxis: 'x' },
    { id: 'wrist',        x: BK_W[0],  y: BK_W[1],  linkedMeasurement: 'sleeveLength',          adjustmentAxis: 'y' },
    { id: 'wrist_circ',   x: BK_W[0],  y: BK_W[1],  linkedMeasurement: 'wristCircumference',    adjustmentAxis: 'x' },
    { id: 'elbow',        x: BK_E[0],  y: BK_E[1],  linkedMeasurement: 'elbowCircumference',    adjustmentAxis: 'x' },
  ];

  return {
    id: 'jacket_sleeve_upper',
    name: (style?.sleeveStyle === 'one_piece_sleeve' || style?.sleeveStyle === 'raglan_sleeve')
      ? 'Sleeve (One Piece)' : 'Sleeve Upper',
    baseSize: 'L',
    svgPath,
    grainLine: { x1: capTopX, y1: capH + 8, x2: capTopX, y2: Y_total - 8 },
    keyPoints,
    seamAllowance: 1.5,
  };
}

// ─────────────────────────────────────────────
//  4. SLEEVE — UNDER
//  (The narrower, concave under-sleeve piece)
// ─────────────────────────────────────────────
export function draftSleeveUnder(m: BodyMeasurements, ease: Ease): PatternPiece {
  const uaHalf  = h2(m.upperArmCircumference, ease.upperArmCircumference) / 2;
  const elHalf  = m.elbowCircumference / 2;
  const wrHalf  = m.wristCircumference / 2;

  const capH    = 9;                          // under-sleeve has a smaller cap
  const Y_total = capH + m.sleeveLength;
  const Y_elbow = capH + m.sleeveLength * 0.55;
  const capTopX = uaHalf * 0.45;

  // ── Named vertices ──
  const CAP:  Vec2 = [capTopX,            0];
  const BK_U: Vec2 = [uaHalf * 1.6,       capH];
  const BK_E: Vec2 = [uaHalf * 1.6 + 0.5, Y_elbow];
  const BK_W: Vec2 = [uaHalf * 1.6 - 0.5, Y_total];
  const FR_W: Vec2 = [uaHalf * 1.6 - 0.5 - wrHalf * 1.8 + 2, Y_total];
  const FR_E: Vec2 = [uaHalf * 1.6 - elHalf * 1.7 + 2,        Y_elbow];
  const FR_U: Vec2 = [0,                  capH];

  // Cap bezier
  const CAP_FR_c1: Vec2 = [FR_U[0],     capH * 0.4];
  const CAP_FR_c2: Vec2 = [capTopX - 2, capH * 0.15];
  const CAP_BK_c1: Vec2 = [capTopX + 2, capH * 0.15];
  const CAP_BK_c2: Vec2 = [BK_U[0] - 2, capH * 0.4];

  const svgPath = [
    `M ${fmtPt(CAP)}`,
    `C ${fmtPt(CAP_FR_c1)} ${fmtPt(CAP_FR_c2)} ${fmtPt(FR_U)}`,
    `L ${fmtPt(FR_E)}`,
    `L ${fmtPt(FR_W)}`,
    `L ${fmtPt(BK_W)}`,
    `L ${fmtPt(BK_E)}`,
    `L ${fmtPt(BK_U)}`,
    `C ${fmtPt(CAP_BK_c1)} ${fmtPt(CAP_BK_c2)} ${fmtPt(CAP)}`,
    'Z',
  ].join(' ');

  const keyPoints: PatternKeyPoint[] = [
    { id: 'bk_underarm', x: BK_U[0], y: BK_U[1], linkedMeasurement: 'upperArmCircumference', adjustmentAxis: 'x' },
    { id: 'wrist',       x: BK_W[0], y: BK_W[1], linkedMeasurement: 'sleeveLength',          adjustmentAxis: 'y' },
    { id: 'wrist_circ',  x: BK_W[0], y: BK_W[1], linkedMeasurement: 'wristCircumference',    adjustmentAxis: 'x' },
  ];

  return {
    id: 'jacket_sleeve_under',
    name: 'Sleeve Under',
    baseSize: 'L',
    svgPath,
    grainLine: { x1: capTopX, y1: capH + 6, x2: capTopX, y2: Y_total - 6 },
    keyPoints,
    seamAllowance: 1.5,
  };
}

// ─────────────────────────────────────────────
//  5. COLLAR
//  Shape and height adapt to the selected collar type.
//  Returns null for 'no_collar'.
// ─────────────────────────────────────────────
export function draftCollar(m: BodyMeasurements, _ease: Ease, style?: JacketStyleOptions): PatternPiece | null {
  const ct = style?.collarType ?? 'notched_lapel';
  if (ct === 'no_collar') return null;

  // ── Geometry parameters per collar type ────────────────────
  let collarLength: number;
  let standH: number;       // stand height (always present)
  let fallH: number;        // fall height (0 for standing-only collars)
  let outerConvex: number;  // outer-edge bezier Y offset (negative = bows outward)
  let neckCurveSag: number; // neckline bezier sag inward
  let pieceName: string;

  switch (ct) {
    case 'shawl_collar':
      collarLength = m.neck / 2 + 14; standH = 4;   fallH = 5;
      outerConvex = -2.5; neckCurveSag = 0.6; pieceName = 'Shawl Collar';
      break;
    case 'mandarin_collar':
      collarLength = m.neck / 2 + 3;  standH = 4;   fallH = 0;
      outerConvex = -0.3; neckCurveSag = 0.4; pieceName = 'Mandarin Collar';
      break;
    case 'chinese_collar':
      collarLength = m.neck / 2 + 3;  standH = 4;   fallH = 0;
      outerConvex = -0.3; neckCurveSag = 0.4; pieceName = 'Chinese Collar';
      break;
    case 'nehru_collar':
      collarLength = m.neck / 2 + 3;  standH = 5.5; fallH = 0;
      outerConvex = -0.4; neckCurveSag = 0.4; pieceName = 'Nehru Collar';
      break;
    case 'band_collar':
      collarLength = m.neck / 2 + 2;  standH = 2.5; fallH = 0;
      outerConvex = -0.15; neckCurveSag = 0.2; pieceName = 'Band Collar';
      break;
    case 'peak_lapel':
      collarLength = m.neck / 2 + 11; standH = 3.5; fallH = 5;
      outerConvex = -1.5; neckCurveSag = 1.2; pieceName = 'Peak Lapel Collar';
      break;
    default: // notched_lapel
      collarLength = m.neck / 2 + 10; standH = 3.5; fallH = 5;
      outerConvex = -1.0; neckCurveSag = 1.2; pieceName = 'Notched Lapel Collar';
      break;
  }

  const totalH = standH + fallH;

  const OE_L: Vec2 = [0,            0];
  const OE_R: Vec2 = [collarLength, 0];
  const BT_R: Vec2 = [collarLength, totalH];
  const BT_L: Vec2 = [0,            totalH];
  const NL_R: Vec2 = [collarLength, standH]; // key-point ref

  // Neckline edge — concave inward (stand curves around neck)
  const NL_c1: Vec2 = [collarLength * 0.25, standH - neckCurveSag];
  const NL_c2: Vec2 = [collarLength * 0.75, standH - neckCurveSag];

  // Outer collar edge — convex (bows away from neck)
  const OE_c1: Vec2 = [collarLength * 0.25, outerConvex];
  const OE_c2: Vec2 = [collarLength * 0.75, outerConvex];

  const svgPath = [
    `M ${fmtPt(OE_L)}`,
    `C ${fmtPt(OE_c1)} ${fmtPt(OE_c2)} ${fmtPt(OE_R)}`,
    `L ${fmtPt(BT_R)}`,
    `C ${fmtPt(NL_c2)} ${fmtPt(NL_c1)} ${fmtPt(BT_L)}`,
    `L ${fmtPt(OE_L)}`,
    'Z',
  ].join(' ');

  return {
    id: 'jacket_collar',
    name: pieceName,
    baseSize: 'L',
    svgPath,
    grainLine: { x1: 4, y1: totalH / 2, x2: collarLength - 4, y2: totalH / 2 },
    keyPoints: [
      { id: 'collar_length', x: NL_R[0], y: NL_R[1], linkedMeasurement: 'neck', adjustmentAxis: 'x' },
    ],
    seamAllowance: 1.0,
  };
}

// ─────────────────────────────────────────────
//  6. VENT UNDERLAP
//  Separate facing piece placed behind the vent opening.
//  • center_vent → one rectangular underlap at CB, 4 cm wide
//  • side_vents  → two identical side underlaps (label: cut 2)
//  Returns [] when backVent === 'no_vent'.
// ─────────────────────────────────────────────
export function draftVentUnderlap(m: BodyMeasurements, style?: JacketStyleOptions): PatternPiece[] {
  const ventStyle = style?.backVent ?? 'center_vent';
  if (ventStyle === 'no_vent') return [];

  const Y_hem       = m.jacketLength;
  const Y_ventBase  = Y_hem - 15;             // vent depth: 15 cm from hem
  const Y_hip       = m.backLength + 18;
  const hipX        = (m.hips + JACKET_EASE.hips) / 4;

  if (ventStyle === 'center_vent') {
    const lapW = 4;                           // underlap width = 4 cm
    const lapH = Y_hem - Y_ventBase;          // vent depth height

    // Rectangle: fold/CB edge at x=0, slit edge at x=lapW
    const TL: Vec2 = [0,    0];
    const TR: Vec2 = [lapW, 0];
    const BR: Vec2 = [lapW, lapH];
    const BL: Vec2 = [0,    lapH];

    const svgPath = [
      `M ${fmtPt(TL)}`, `L ${fmtPt(TR)}`,
      `L ${fmtPt(BR)}`, `L ${fmtPt(BL)}`, 'Z',
    ].join(' ');

    return [{
      id:            'jacket_vent_underlap',
      name:          'Center Vent Underlap',
      baseSize:      'L',
      svgPath,
      grainLine:     { x1: lapW / 2, y1: 2, x2: lapW / 2, y2: lapH - 2 },
      keyPoints:     [],
      seamAllowance: 1.0,
    }];
  }

  // side_vents: two mirror underlaps at the side seam
  const Y_ventSide = Math.max(Y_hip, Y_ventBase);
  const lapW = 4;
  const lapH = Y_hem - Y_ventSide;

  const TL: Vec2 = [0,    0];
  const TR: Vec2 = [lapW, 0];
  const BR: Vec2 = [lapW, lapH];
  const BL: Vec2 = [0,    lapH];
  const _ = hipX;  // suppress unused-variable warning
  void _;

  const svgPath = [
    `M ${fmtPt(TL)}`, `L ${fmtPt(TR)}`,
    `L ${fmtPt(BR)}`, `L ${fmtPt(BL)}`, 'Z',
  ].join(' ');

  const piece: PatternPiece = {
    id:            'jacket_side_vent_underlap',
    name:          'Side Vent Underlap (Cut 2)',
    baseSize:      'L',
    svgPath,
    grainLine:     { x1: lapW / 2, y1: 2, x2: lapW / 2, y2: lapH - 2 },
    keyPoints:     [],
    seamAllowance: 1.0,
  };
  return [piece];  // one piece object, labelled 'cut 2'
}
export function draftAllJacketPieces(m: BodyMeasurements, style?: JacketStyleOptions): PatternPiece[] {
  const ease        = JACKET_EASE;
  const sleeveStyle = style?.sleeveStyle ?? 'two_piece_sleeve';

  const pieces: PatternPiece[] = [
    draftFrontPanel(m, ease, style),
    draftBackPanel(m, ease, style),
    draftSleeveUpper(m, ease, style),
  ];

  // Two-piece sleeve includes the under-sleeve; one-piece / raglan does not
  if (sleeveStyle === 'two_piece_sleeve') {
    pieces.push(draftSleeveUnder(m, ease));
  }

  // Collar piece omitted when 'no_collar' is selected
  const collar = draftCollar(m, ease, style);
  if (collar !== null) pieces.push(collar);

  // Vent underlap(s) — separate construction piece(s)
  const underlaps = draftVentUnderlap(m, style);
  pieces.push(...underlaps);

  return pieces;
}

// Human-readable labels for each measurement key (for adjustment report)
export const MEASUREMENT_LABELS: Partial<Record<keyof BodyMeasurements, string>> = {
  chest:                'Chest Circumference',
  waist:                'Waist Circumference',
  hips:                 'Hips Circumference',
  neck:                 'Neck Circumference',
  shoulderWidth:        'Shoulder Width',
  sleeveLength:         'Sleeve Length',
  jacketLength:         'Jacket Length',
  backLength:           'Back Length (to Waist)',
  armholeDepth:         'Armhole Depth',
  upperArmCircumference:'Upper Arm (Bicep)',
  elbowCircumference:   'Elbow Circumference',
  wristCircumference:   'Wrist Circumference',
};
