// ─────────────────────────────────────────────
//  Body Measurement Types
// ─────────────────────────────────────────────

export interface BodyMeasurements {
  // Core circumferences (cm)
  chest: number;
  waist: number;
  hips: number;
  neck: number;

  // Lengths
  shoulderWidth: number;
  sleeveLength: number;
  jacketLength: number;
  backLength: number;

  // Widths
  chestWidth: number;
  backWidth: number;

  // Arm
  upperArmCircumference: number;
  wristCircumference: number;
  elbowCircumference: number;

  // Height references
  totalHeight: number;
  armholeDepth: number;

  // Optional advanced
  frontChestLength?: number;
  napeToWaist?: number;
}

export type BaseSize = 'S' | 'M' | 'L' | 'XL';

export type MeasurementUnit = 'cm' | 'in';

export interface StandardSizeMeasurements
  extends Omit<BodyMeasurements, 'frontChestLength' | 'napeToWaist'> {}

// Measurement field metadata for UI rendering
export interface MeasurementFieldMeta {
  key: keyof BodyMeasurements;
  label: string;
  description: string;
  group: MeasurementGroup;
  optional?: boolean;
  min: number;
  max: number;
}

export type MeasurementGroup =
  | 'circumferences'
  | 'lengths'
  | 'widths'
  | 'arm'
  | 'height'
  | 'advanced';

export type ValidationErrors = Partial<Record<keyof BodyMeasurements, string>>;
