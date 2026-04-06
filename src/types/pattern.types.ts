import type { BodyMeasurements, BaseSize } from './measurements.types';

// ─────────────────────────────────────────────
//  Pattern Types
// ─────────────────────────────────────────────

export interface PatternKeyPoint {
  id: string;
  x: number;
  y: number;
  linkedMeasurement: keyof BodyMeasurements;
  adjustmentAxis: 'x' | 'y' | 'both';
}

export interface PatternPiece {
  id: string;
  name: string;
  baseSize: BaseSize;
  svgPath: string;
  grainLine: { x1: number; y1: number; x2: number; y2: number };
  keyPoints: PatternKeyPoint[];
  seamAllowance: number; // cm
}

export interface AdjustedPatternPiece extends PatternPiece {
  adjustedSvgPath: string;
  adjustments: PatternAdjustmentEntry[];
}

export interface PatternAdjustmentEntry {
  measurementKey: keyof BodyMeasurements;
  label: string;
  baseValue: number;
  userValue: number;
  delta: number;
}

export interface AdjustmentReport {
  pieces: {
    pieceId: string;
    pieceName: string;
    entries: PatternAdjustmentEntry[];
  }[];
}
