import type { BaseSize, BodyMeasurements } from '../types/measurements.types';

// ─────────────────────────────────────────────
//  Standard Size Reference Table (all cm)
// ─────────────────────────────────────────────

export type StandardSizeTable = Record<BaseSize, Omit<BodyMeasurements, 'frontChestLength' | 'napeToWaist'>>;

export const STANDARD_SIZES: StandardSizeTable = {
  S: {
    chest: 88,
    waist: 72,
    hips: 92,
    neck: 37,
    shoulderWidth: 42,
    sleeveLength: 60,
    jacketLength: 70,
    backLength: 42,
    chestWidth: 36,
    backWidth: 34,
    upperArmCircumference: 32,
    wristCircumference: 17,
    elbowCircumference: 27,
    totalHeight: 168,
    armholeDepth: 22,
  },
  M: {
    chest: 96,
    waist: 80,
    hips: 100,
    neck: 39,
    shoulderWidth: 44,
    sleeveLength: 62,
    jacketLength: 72,
    backLength: 43,
    chestWidth: 38,
    backWidth: 36,
    upperArmCircumference: 34,
    wristCircumference: 18,
    elbowCircumference: 29,
    totalHeight: 173,
    armholeDepth: 23,
  },
  L: {
    chest: 104,
    waist: 88,
    hips: 108,
    neck: 41,
    shoulderWidth: 46,
    sleeveLength: 63,
    jacketLength: 74,
    backLength: 44,
    chestWidth: 40,
    backWidth: 38,
    upperArmCircumference: 36,
    wristCircumference: 19,
    elbowCircumference: 31,
    totalHeight: 176,
    armholeDepth: 24,
  },
  XL: {
    chest: 112,
    waist: 96,
    hips: 116,
    neck: 43,
    shoulderWidth: 48,
    sleeveLength: 64,
    jacketLength: 76,
    backLength: 45,
    chestWidth: 42,
    backWidth: 40,
    upperArmCircumference: 38,
    wristCircumference: 20,
    elbowCircumference: 33,
    totalHeight: 178,
    armholeDepth: 25,
  },
};

// Jacket ease allowances (added on top of body measurements)
export const JACKET_EASE = {
  chest: 8,
  waist: 6,
  hips: 6,
  upperArmCircumference: 4,
};
