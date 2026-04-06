// ─────────────────────────────────────────────
//  Pattern Adjuster
//  Core algorithm: compute adjusted pattern pieces
//  by drafting from user measurements vs base size,
//  and generate the adjustment report.
// ─────────────────────────────────────────────

import type { BodyMeasurements, BaseSize } from '../../types/measurements.types';
import type { AdjustedPatternPiece, AdjustmentReport, PatternAdjustmentEntry } from '../../types/pattern.types';
import { STANDARD_SIZES } from '../../data/standardSizes';
import { draftAllJacketPieces, MEASUREMENT_LABELS } from '../../data/jacketPatterns';

// ─────────────────────────────────────────────
//  computeAdjustedPieces
//
//  For each pattern piece:
//   1. Draft the BASE (size L) path  ← shown as grey reference
//   2. Draft the USER path           ← shown in primary colour
//   3. Collect the per-piece adjustments for the report
// ─────────────────────────────────────────────
export function computeAdjustedPieces(
  userMeasurements: BodyMeasurements,
  baseSize: BaseSize = 'L',
): AdjustedPatternPiece[] {
  const baseMeasurements = STANDARD_SIZES[baseSize] as BodyMeasurements;

  // Draft both sets of pieces
  const basePieces = draftAllJacketPieces(baseMeasurements);
  const userPieces = draftAllJacketPieces(userMeasurements);

  return basePieces.map((basePiece, idx) => {
    const userPiece = userPieces[idx];

    // Per-piece adjustment entries: one entry per unique linkedMeasurement
    const seenMeasurements = new Set<keyof BodyMeasurements>();
    const entries: PatternAdjustmentEntry[] = [];

    for (const kp of basePiece.keyPoints) {
      const key = kp.linkedMeasurement;
      if (seenMeasurements.has(key)) continue;
      seenMeasurements.add(key);

      const baseVal = (baseMeasurements as unknown as Record<string, number>)[key as string] ?? 0;
      const userVal = (userMeasurements as unknown as Record<string, number>)[key as string] ?? baseVal;
      const delta = userVal - baseVal;

      entries.push({
        measurementKey: key,
        label: MEASUREMENT_LABELS[key] ?? String(key),
        baseValue: baseVal,
        userValue: userVal,
        delta,
      });
    }

    return {
      ...userPiece,
      // The seam-path is the user-measurement draft (primary colour)
      adjustedSvgPath: userPiece.svgPath,
      adjustments: entries,
      // Keep the base path available for overlay display
      // (stored in svgPath of the returned object — callers use
      //  adjustedSvgPath for user path and svgPath for base path)
      svgPath: basePiece.svgPath,
    } satisfies AdjustedPatternPiece;
  });
}

// ─────────────────────────────────────────────
//  buildAdjustmentReport
// ─────────────────────────────────────────────
export function buildAdjustmentReport(
  userMeasurements: BodyMeasurements,
  baseSize: BaseSize = 'L',
): AdjustmentReport {
  const adjusted = computeAdjustedPieces(userMeasurements, baseSize);

  return {
    pieces: adjusted.map((p) => ({
      pieceId: p.id,
      pieceName: p.name,
      entries: p.adjustments,
    })),
  };
}

// ─────────────────────────────────────────────
//  Utility: classify adjustment delta for UI
// ─────────────────────────────────────────────
export type DeltaStatus = 'ok' | 'warn' | 'error';

export function classifyDelta(delta: number): DeltaStatus {
  const abs = Math.abs(delta);
  if (abs === 0) return 'ok';
  if (abs <= 5) return 'ok';
  if (abs <= 10) return 'warn';
  return 'error';
}
