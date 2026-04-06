// ─────────────────────────────────────────────
//  Measurement Unit Converter
// ─────────────────────────────────────────────

const CM_TO_IN = 1 / 2.54;
const IN_TO_CM = 2.54;

/** Convert a value from cm to inches, rounded to 2 dp */
export function cmToIn(cm: number): number {
  return Math.round(cm * CM_TO_IN * 100) / 100;
}

/** Convert a value from inches to cm, rounded to 1 dp */
export function inToCm(inches: number): number {
  return Math.round(inches * IN_TO_CM * 10) / 10;
}

/**
 * Format a measurement for display.
 * @param value  – raw cm value stored in state
 * @param unit   – currently selected display unit
 */
export function formatMeasurement(value: number, unit: 'cm' | 'in'): string {
  if (unit === 'in') {
    return `${cmToIn(value).toFixed(2)} in`;
  }
  return `${value.toFixed(1)} cm`;
}

/**
 * Parse a user-typed string (e.g. "38.5" or "15.2") into a cm number.
 * @param raw  – raw input string
 * @param unit – the unit the user is currently entering in
 */
export function parseInputToCm(raw: string, unit: 'cm' | 'in'): number {
  const num = parseFloat(raw);
  if (isNaN(num)) return 0;
  return unit === 'in' ? inToCm(num) : num;
}

/**
 * Convert a cm value to the display unit for an <input> field (no unit label).
 */
export function cmToDisplayValue(cm: number, unit: 'cm' | 'in'): string {
  if (unit === 'in') return cmToIn(cm).toFixed(2);
  return cm.toFixed(1);
}
