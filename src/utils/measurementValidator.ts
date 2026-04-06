import type { BodyMeasurements, ValidationErrors } from '../types/measurements.types';
import { MEASUREMENT_FIELDS } from '../data/patternPieceConfig';

// ─────────────────────────────────────────────
//  Measurement Validator
// ─────────────────────────────────────────────

export function validateMeasurements(m: BodyMeasurements): ValidationErrors {
  const errors: ValidationErrors = {};

  // Range checks from field metadata
  for (const field of MEASUREMENT_FIELDS) {
    const value = m[field.key];
    if (value === undefined || value === null) {
      if (!field.optional) {
        errors[field.key] = `${field.label} is required.`;
      }
      continue;
    }
    if (typeof value !== 'number' || isNaN(value)) {
      errors[field.key] = `${field.label} must be a number.`;
      continue;
    }
    if (value < field.min) {
      errors[field.key] =
        `${field.label} must be at least ${field.min} cm.`;
    } else if (value > field.max) {
      errors[field.key] =
        `${field.label} must be at most ${field.max} cm.`;
    }
  }

  // Cross-field validation
  if (!errors.waist && !errors.chest && m.waist >= m.chest) {
    errors.waist = 'Waist must be less than chest measurement.';
  }

  if (!errors.hips && !errors.chest && m.hips < m.waist) {
    errors.hips = 'Hips should not be less than waist.';
  }

  if (!errors.jacketLength && !errors.backLength && m.backLength >= m.jacketLength) {
    errors.backLength = 'Back length must be shorter than total jacket length.';
  }

  if (!errors.elbowCircumference && !errors.upperArmCircumference
    && m.elbowCircumference >= m.upperArmCircumference) {
    errors.elbowCircumference =
      'Elbow circumference should be less than upper arm circumference.';
  }

  if (!errors.wristCircumference && !errors.elbowCircumference
    && m.wristCircumference >= m.elbowCircumference) {
    errors.wristCircumference =
      'Wrist circumference should be less than elbow circumference.';
  }

  return errors;
}

export function isValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}
