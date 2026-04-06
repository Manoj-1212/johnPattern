import { create } from 'zustand';
import type { BodyMeasurements, BaseSize, MeasurementUnit, ValidationErrors } from '../types/measurements.types';
import type { JacketStyleOptions } from '../types/style.types';
import type { AdjustedPatternPiece, AdjustmentReport } from '../types/pattern.types';
import { STANDARD_SIZES } from '../data/standardSizes';

// ─────────────────────────────────────────────
//  Default style options
// ─────────────────────────────────────────────

const DEFAULT_STYLE_OPTIONS: JacketStyleOptions = {
  collarType: 'notched_lapel',
  lapelStyle: 'notched',
  lapelWidth: 'medium',
  buttonConfig: {
    style: 'single_breasted_2btn',
    buttonCount: 2,
    buttonSize: 20,
    buttonholeType: 'horizontal',
  },
  pocketConfig: {
    chestPocket: 'welt_pocket',
    sidePockets: 'flap_pocket',
    includeTicketPocket: false,
    pocketWidth: 14,
    pocketPosition: 4,
  },
  sleeveStyle: 'two_piece_sleeve',
  cuffConfig: {
    style: 'functioning_buttons',
    buttonCount: 3,
  },
  backVent: 'center_vent',
  backSeam: 'no_seam',
  liningConfig: {
    fullyLined: true,
    halfLined: false,
    noLining: false,
    liningColor: '#5b4a8a',
  },
};

// ─────────────────────────────────────────────
//  App State
// ─────────────────────────────────────────────

type ActiveView = 'measurements' | 'mannequin' | 'pattern' | 'report' | 'style' | 'export';

interface AppState {
  // Measurements
  measurements: BodyMeasurements;
  setMeasurements: (m: Partial<BodyMeasurements>) => void;
  resetMeasurements: () => void;

  // Validation
  validationErrors: ValidationErrors;
  setValidationErrors: (errors: ValidationErrors) => void;

  // Unit toggle
  unit: MeasurementUnit;
  setUnit: (unit: MeasurementUnit) => void;

  // Garment & base size
  garmentType: 'jacket';
  baseSize: BaseSize;
  setBaseSize: (size: BaseSize) => void;

  // Style choices
  styleOptions: JacketStyleOptions;
  setStyleOption: <K extends keyof JacketStyleOptions>(
    key: K,
    value: JacketStyleOptions[K],
  ) => void;

  // Pattern
  patternPieces: AdjustedPatternPiece[];
  adjustmentReport: AdjustmentReport | null;

  // UI
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedPatternPiece: string | null;
  setSelectedPatternPiece: (id: string | null) => void;
  mannequinWireframe: boolean;
  toggleWireframe: () => void;
}

const DEFAULT_MEASUREMENTS = { ...STANDARD_SIZES.L } as BodyMeasurements;

export const useAppStore = create<AppState>()((set) => ({
  // Measurements
  measurements: DEFAULT_MEASUREMENTS,
  setMeasurements: (m) =>
    set((state) => ({ measurements: { ...state.measurements, ...m } })),
  resetMeasurements: () => set({ measurements: DEFAULT_MEASUREMENTS }),

  // Validation
  validationErrors: {},
  setValidationErrors: (errors) => set({ validationErrors: errors }),

  // Unit
  unit: 'cm',
  setUnit: (unit) => set({ unit }),

  // Garment
  garmentType: 'jacket',
  baseSize: 'L',
  setBaseSize: (baseSize) =>
    set({ baseSize, measurements: { ...STANDARD_SIZES[baseSize] } as BodyMeasurements }),

  // Style
  styleOptions: DEFAULT_STYLE_OPTIONS,
  setStyleOption: (key, value) =>
    set((state) => ({
      styleOptions: { ...state.styleOptions, [key]: value },
    })),

  // Pattern
  patternPieces: [],
  adjustmentReport: null,

  // UI
  activeView: 'measurements',
  setActiveView: (activeView) => set({ activeView }),
  selectedPatternPiece: null,
  setSelectedPatternPiece: (id) => set({ selectedPatternPiece: id }),
  mannequinWireframe: false,
  toggleWireframe: () =>
    set((state) => ({ mannequinWireframe: !state.mannequinWireframe })),
}));
