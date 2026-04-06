import type { MeasurementFieldMeta } from '../types/measurements.types';

// ─────────────────────────────────────────────
//  Field definitions — used to render the form
//  All min/max values are in cm.
// ─────────────────────────────────────────────

export const MEASUREMENT_FIELDS: MeasurementFieldMeta[] = [
  // ── Circumferences ──────────────────────────
  {
    key: 'chest',
    label: 'Chest',
    description: 'Full chest circumference at the widest point',
    group: 'circumferences',
    min: 60,
    max: 160,
  },
  {
    key: 'waist',
    label: 'Waist',
    description: 'Natural waist circumference',
    group: 'circumferences',
    min: 50,
    max: 150,
  },
  {
    key: 'hips',
    label: 'Hips',
    description: 'Full hip circumference at the widest point',
    group: 'circumferences',
    min: 60,
    max: 170,
  },
  {
    key: 'neck',
    label: 'Neck',
    description: 'Neck circumference at the base',
    group: 'circumferences',
    min: 28,
    max: 60,
  },

  // ── Lengths ──────────────────────────────────
  {
    key: 'jacketLength',
    label: 'Jacket Length',
    description: 'From back neck point to desired hem',
    group: 'lengths',
    min: 55,
    max: 95,
  },
  {
    key: 'backLength',
    label: 'Back Length',
    description: 'From back neck point to natural waist',
    group: 'lengths',
    min: 35,
    max: 55,
  },
  {
    key: 'sleeveLength',
    label: 'Sleeve Length',
    description: 'From shoulder point to wrist',
    group: 'lengths',
    min: 45,
    max: 80,
  },

  // ── Widths ────────────────────────────────────
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
    description: 'Shoulder point to shoulder point across the back',
    group: 'widths',
    min: 30,
    max: 60,
  },
  {
    key: 'chestWidth',
    label: 'Chest Width (Front)',
    description: 'Across the chest, armhole to armhole (front)',
    group: 'widths',
    min: 28,
    max: 55,
  },
  {
    key: 'backWidth',
    label: 'Back Width',
    description: 'Across the back, armhole to armhole',
    group: 'widths',
    min: 28,
    max: 55,
  },

  // ── Arm ───────────────────────────────────────
  {
    key: 'upperArmCircumference',
    label: 'Upper Arm (Bicep)',
    description: 'Bicep circumference at the fullest point',
    group: 'arm',
    min: 22,
    max: 60,
  },
  {
    key: 'elbowCircumference',
    label: 'Elbow',
    description: 'Elbow circumference with arm slightly bent',
    group: 'arm',
    min: 20,
    max: 50,
  },
  {
    key: 'wristCircumference',
    label: 'Wrist',
    description: 'Wrist circumference',
    group: 'arm',
    min: 13,
    max: 30,
  },

  // ── Height References ─────────────────────────
  {
    key: 'totalHeight',
    label: 'Total Height',
    description: 'Full standing body height',
    group: 'height',
    min: 140,
    max: 220,
  },
  {
    key: 'armholeDepth',
    label: 'Armhole Depth',
    description: 'From neck base to underarm level',
    group: 'height',
    min: 16,
    max: 32,
  },

  // ── Advanced (optional) ───────────────────────
  {
    key: 'frontChestLength',
    label: 'Front Chest Length',
    description: 'High point shoulder to bust line (optional)',
    group: 'advanced',
    optional: true,
    min: 16,
    max: 36,
  },
  {
    key: 'napeToWaist',
    label: 'Nape to Waist',
    description: 'Nape of neck to waist, back measurement (optional)',
    group: 'advanced',
    optional: true,
    min: 35,
    max: 55,
  },
];

export const GROUP_LABELS: Record<string, string> = {
  circumferences: 'Circumferences',
  lengths: 'Lengths',
  widths: 'Widths',
  arm: 'Arm Measurements',
  height: 'Height References',
  advanced: 'Advanced (Optional)',
};
