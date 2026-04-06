// ─────────────────────────────────────────────
//  CollarSelector
//  8 collar types, each with an inline SVG sketch
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { CollarType } from '../../types/style.types';
import StyleOptionCard from './StyleOptionCard';

// ── SVG Sketches ──────────────────────────────
// Each sketch is 48×48, filling a front-neck view of a jacket.
// Stroke colour inherits from parent (currentColor).

const SKETCHES: Record<CollarType, React.ReactNode> = {
  notched_lapel: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      {/* Jacket front edges */}
      <line x1="18" y1="6"  x2="12" y2="46" />
      <line x1="30" y1="6"  x2="36" y2="46" />
      {/* Lapel fold — left */}
      <path d="M18,6 L10,18 L15,24 L24,15 Z" fill="currentColor" fillOpacity="0.08" />
      {/* Lapel fold — right */}
      <path d="M30,6 L38,18 L33,24 L24,15 Z" fill="currentColor" fillOpacity="0.08" />
      {/* Collar stand */}
      <path d="M18,6 C20,3 28,3 30,6" fill="none" />
      {/* Notch cut */}
      <line x1="15" y1="24" x2="18" y2="20" />
      <line x1="33" y1="24" x2="30" y2="20" />
    </svg>
  ),

  peak_lapel: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="18" y1="6"  x2="12" y2="46" />
      <line x1="30" y1="6"  x2="36" y2="46" />
      {/* Peak lapel — pointed upward */}
      <path d="M18,6 L7,14 L14,26 L24,14 Z" fill="currentColor" fillOpacity="0.08" />
      <path d="M30,6 L41,14 L34,26 L24,14 Z" fill="currentColor" fillOpacity="0.08" />
      {/* Collar */}
      <path d="M18,6 C20,3 28,3 30,6" fill="none" />
    </svg>
  ),

  shawl_collar: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="18" y1="8"  x2="12" y2="46" />
      <line x1="30" y1="8"  x2="36" y2="46" />
      {/* Continuous shawl — no notch */}
      <path d="M18,8 C14,12 12,22 18,28 L24,20 L30,28 C36,22 34,12 30,8 C28,4 20,4 18,8Z"
        fill="currentColor" fillOpacity="0.08" />
    </svg>
  ),

  mandarin_collar: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="22" y1="14" x2="18" y2="46" />
      <line x1="26" y1="14" x2="30" y2="46" />
      {/* Band collar — simple rectangle around neck */}
      <path d="M16,8 L16,14 C16,14 20,16 24,16 C28,16 32,14 32,14 L32,8 C32,8 28,6 24,6 C20,6 16,8 16,8Z"
        fill="currentColor" fillOpacity="0.12" stroke="currentColor" />
      {/* Center opening gap */}
      <line x1="22" y1="8" x2="22" y2="14" strokeDasharray="1.5,1.5" />
      <line x1="26" y1="8" x2="26" y2="14" strokeDasharray="1.5,1.5" />
    </svg>
  ),

  chinese_collar: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="22" y1="16" x2="18" y2="46" />
      <line x1="26" y1="16" x2="30" y2="46" />
      {/* Chinese collar — taller band, curved at top */}
      <path d="M16,9 C16,7 20,5 24,5 C28,5 32,7 32,9 L32,16 C32,16 28,18 24,18 C20,18 16,16 16,16Z"
        fill="currentColor" fillOpacity="0.12" stroke="currentColor" />
      {/* Curved top edge */}
      <path d="M20,5 C20,4 24,3 24,3 C24,3 28,4 28,5" strokeDasharray="2,1" />
    </svg>
  ),

  nehru_collar: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="22" y1="18" x2="18" y2="46" />
      <line x1="26" y1="18" x2="30" y2="46" />
      {/* Nehru — taller stand, squared corners */}
      <rect x="16" y="6" width="16" height="12" rx="2"
        fill="currentColor" fillOpacity="0.12" stroke="currentColor" />
      {/* Button at top center */}
      <circle cx="24" cy="9" r="1.5" fill="currentColor" />
      <circle cx="24" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),

  band_collar: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="22" y1="13" x2="18" y2="46" />
      <line x1="26" y1="13" x2="30" y2="46" />
      {/* Band only — very low profile */}
      <path d="M17,9 C17,7.5 20,6.5 24,6.5 C28,6.5 31,7.5 31,9 L31,13 C31,14 28,15 24,15 C20,15 17,14 17,13Z"
        fill="currentColor" fillOpacity="0.12" stroke="currentColor" />
    </svg>
  ),

  no_collar: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <line x1="20" y1="12" x2="14" y2="46" />
      <line x1="28" y1="12" x2="34" y2="46" />
      {/* Clean crew / collarless — just the neckline */}
      <path d="M20,12 C20,8 28,8 28,12" fill="none" />
      {/* Crossed-out indicator */}
      <line x1="20" y1="8" x2="28" y2="14" strokeDasharray="2,1.5" opacity="0.4" />
    </svg>
  ),
};

const COLLAR_LABELS: Record<CollarType, string> = {
  notched_lapel:   'Notched',
  peak_lapel:      'Peak',
  shawl_collar:    'Shawl',
  mandarin_collar: 'Mandarin',
  chinese_collar:  'Chinese',
  nehru_collar:    'Nehru',
  band_collar:     'Band',
  no_collar:       'No Collar',
};

const COLLAR_DESC: Record<CollarType, string> = {
  notched_lapel:   'Classic western jacket with notch cut in lapel',
  peak_lapel:      'Formal peak lapel — points upward toward shoulders',
  shawl_collar:    'Continuous curved tuxedo / dinner jacket collar',
  mandarin_collar: 'Short stand-up band, no lapel — modern minimalist',
  chinese_collar:  'Slightly curved mandarin with taller stand',
  nehru_collar:    'Indian style — squared-off taller band collar',
  band_collar:     'Minimal band only — lowest profile collar',
  no_collar:       'Collarless — clean crew-neck jacket',
};

const ALL_COLLARS: CollarType[] = [
  'notched_lapel', 'peak_lapel', 'shawl_collar',
  'mandarin_collar', 'chinese_collar', 'nehru_collar',
  'band_collar', 'no_collar',
];

export default function CollarSelector() {
  const collarType    = useAppStore((s) => s.styleOptions.collarType);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        {COLLAR_DESC[collarType]}
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_COLLARS.map((c) => (
          <StyleOptionCard
            key={c}
            label={COLLAR_LABELS[c]}
            description={COLLAR_DESC[c]}
            isSelected={collarType === c}
            onClick={() => setStyleOption('collarType', c)}
          >
            {SKETCHES[c]}
          </StyleOptionCard>
        ))}
      </div>
    </div>
  );
}
