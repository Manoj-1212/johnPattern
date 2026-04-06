import type { BodyMeasurements } from '../types/measurements.types';

// ─────────────────────────────────────────────
//  Morph Weight Mapper
//  Maps user measurements → normalised deltas
//  against base (L size) values.
//  Positive = bigger than base, Negative = smaller.
// ─────────────────────────────────────────────

export interface MorphWeights {
  chestMorph: number;
  waistMorph: number;
  hipsMorph: number;
  shoulderMorph: number;
  neckMorph: number;
  heightMorph: number;
  sleeveMorph: number;
  upperArmMorph: number;
}

// Base = L size values (cm)
const BASE: Record<keyof MorphWeights, number> = {
  chestMorph:     104,
  waistMorph:      88,
  hipsMorph:      108,
  shoulderMorph:   46,
  neckMorph:       41,
  heightMorph:    176,
  sleeveMorph:     63,
  upperArmMorph:   36,
};

export function measurementsToMorphWeights(m: BodyMeasurements): MorphWeights {
  return {
    chestMorph:    (m.chest              - BASE.chestMorph)    / BASE.chestMorph,
    waistMorph:    (m.waist              - BASE.waistMorph)    / BASE.waistMorph,
    hipsMorph:     (m.hips               - BASE.hipsMorph)     / BASE.hipsMorph,
    shoulderMorph: (m.shoulderWidth      - BASE.shoulderMorph) / BASE.shoulderMorph,
    neckMorph:     (m.neck               - BASE.neckMorph)     / BASE.neckMorph,
    heightMorph:   (m.totalHeight        - BASE.heightMorph)   / BASE.heightMorph,
    sleeveMorph:   (m.sleeveLength       - BASE.sleeveMorph)   / BASE.sleeveMorph,
    upperArmMorph: (m.upperArmCircumference - BASE.upperArmMorph) / BASE.upperArmMorph,
  };
}

// ─────────────────────────────────────────────
//  Derived 3D geometry parameters from measurements
//  All units converted to Three.js scene units (1 unit ≈ 1 cm)
// ─────────────────────────────────────────────

export interface MannequinDimensions {
  // Head
  headRadius: number;

  // Neck
  neckRadius: number;
  neckHeight: number;

  // Shoulder
  shoulderHalfSpan: number;   // half of shoulderWidth

  // Chest ellipsoid  (x = front-back depth, z = side width)
  chestRadiusX: number;       // front-back depth ≈ chest / (2π) * 0.6
  chestRadiusZ: number;       // lateral ≈ chest / (2π) * 0.72
  chestHeight: number;        // from shoulder to waist (backLength)

  // Waist
  waistRadiusX: number;
  waistRadiusZ: number;
  waistHeight: number;        // waist band height

  // Hips ellipsoid
  hipsRadiusX: number;
  hipsRadiusZ: number;
  hipsHeight: number;

  // Upper arm
  upperArmRadius: number;
  upperArmLength: number;

  // Forearm
  forearmRadius: number;
  forearmLength: number;

  // Wrist
  wristRadius: number;

  // Full height reference (used to position segments)
  totalHeight: number;
  jacketLength: number;
  armholeDepth: number;
}

/** Convert circumference in cm to a radius for Three.js geometry (cm unit) */
function circumToRadius(circ: number): number {
  return circ / (2 * Math.PI);
}

export function measurementsToDimensions(m: BodyMeasurements): MannequinDimensions {
  const chestR    = circumToRadius(m.chest);
  const waistR    = circumToRadius(m.waist);
  const hipsR     = circumToRadius(m.hips);
  const neckR     = circumToRadius(m.neck);
  const upperArmR = circumToRadius(m.upperArmCircumference);
  const elbowR    = circumToRadius(m.elbowCircumference);
  const wristR    = circumToRadius(m.wristCircumference);

  // Forearm = shoulder point to wrist minus upper arm length (~armhole to elbow)
  const upperArmLength = m.sleeveLength * 0.45;
  const forearmLength  = m.sleeveLength * 0.55;

  return {
    headRadius:      neckR * 1.85,
    neckRadius:      neckR,
    neckHeight:      neckR * 2.8,
    shoulderHalfSpan: m.shoulderWidth / 2,

    // Chest: front-back depth ≈ 60% of circumradius, lateral ≈ 72%
    chestRadiusX: chestR * 0.60,
    chestRadiusZ: chestR * 0.72,
    chestHeight:  m.backLength,

    waistRadiusX: waistR * 0.58,
    waistRadiusZ: waistR * 0.70,
    waistHeight:  6,

    hipsRadiusX: hipsR * 0.60,
    hipsRadiusZ: hipsR * 0.74,
    hipsHeight:  16,

    upperArmRadius: upperArmR,
    upperArmLength,

    forearmRadius: elbowR * 0.85,
    forearmLength,

    wristRadius: wristR,

    totalHeight:  m.totalHeight,
    jacketLength: m.jacketLength,
    armholeDepth: m.armholeDepth,
  };
}
