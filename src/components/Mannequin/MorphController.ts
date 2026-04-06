import { useMemo } from 'react';
import type { BodyMeasurements } from '../../types/measurements.types';
import {
  measurementsToDimensions,
  measurementsToMorphWeights,
  type MannequinDimensions,
  type MorphWeights,
} from '../../utils/morphWeightMapper';

// ─────────────────────────────────────────────
//  MorphController
//  Derives 3D geometry parameters from the
//  current store measurements. Acts as the
//  bridge between the measurement state and the
//  MannequinMesh renderer.
// ─────────────────────────────────────────────

export interface MorphControllerOutput {
  dims: MannequinDimensions;
  weights: MorphWeights;
  /** Vertical offset so the mannequin sits "on the ground" at y=0 */
  groundOffset: number;
}

export function useMorphController(measurements: BodyMeasurements): MorphControllerOutput {
  return useMemo(() => {
    const dims    = measurementsToDimensions(measurements);
    const weights = measurementsToMorphWeights(measurements);

    // Hip bottom is at y=0 in mesh space; shift the group down so it
    // appears to stand on the floor of the scene (y = negative half of total)
    const groundOffset = 0; // mesh already builds upward from 0

    return { dims, weights, groundOffset };
  }, [measurements]);
}
