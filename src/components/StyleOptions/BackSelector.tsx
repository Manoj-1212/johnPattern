// ─────────────────────────────────────────────
//  BackSelector — back vent + back seam options
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { BackVent, BackSeam } from '../../types/style.types';
import StyleOptionCard from './StyleOptionCard';

// ── Back vent sketches ─────────────────────────

const VENT_SKETCHES: Record<BackVent, React.ReactNode> = {
  no_vent: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Back jacket outline — clean hem */}
      <rect x="10" y="6" width="28" height="38" rx="2" fill="currentColor" fillOpacity="0.07" />
      <line x1="10" y1="44" x2="38" y2="44" />
    </svg>
  ),
  center_vent: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Back panel */}
      <rect x="10" y="6" width="28" height="38" rx="2" fill="currentColor" fillOpacity="0.07" />
      {/* Center vent — slit from hem up */}
      <line x1="24" y1="28" x2="24" y2="44" />
      {/* Vent underlap (dashed) */}
      <path d="M24,28 L26,28 L26,44" strokeDasharray="2,1.5" opacity="0.5" />
    </svg>
  ),
  side_vents: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Back panel */}
      <rect x="10" y="6" width="28" height="38" rx="2" fill="currentColor" fillOpacity="0.07" />
      {/* Two side vents */}
      <line x1="16" y1="30" x2="16" y2="44" />
      <line x1="32" y1="30" x2="32" y2="44" />
    </svg>
  ),
};

const VENT_LABELS: Record<BackVent, string> = {
  no_vent:     'No Vent',
  center_vent: 'Centre',
  side_vents:  'Side Vents',
};

const VENT_DESC: Record<BackVent, string> = {
  no_vent:     'Clean back hem — no slit',
  center_vent: 'Single vent at centre back — most common',
  side_vents:  'Two vents at side seams — greater movement',
};

// ── Back seam sketches ─────────────────────────

const SEAM_SKETCHES: Record<BackSeam, React.ReactNode> = {
  no_seam: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Single clean back panel */}
      <rect x="10" y="6" width="28" height="38" rx="2" fill="currentColor" fillOpacity="0.07" />
    </svg>
  ),
  center_seam: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      <rect x="10" y="6" width="28" height="38" rx="2" fill="currentColor" fillOpacity="0.07" />
      {/* Straight seam down centre */}
      <line x1="24" y1="6" x2="24" y2="44" />
    </svg>
  ),
  princess_seam: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      <rect x="10" y="6" width="28" height="38" rx="2" fill="currentColor" fillOpacity="0.07" />
      {/* Curved princess seams */}
      <path d="M18,6 C18,18 17,28 16,44" />
      <path d="M30,6 C30,18 31,28 32,44" />
    </svg>
  ),
};

const SEAM_LABELS: Record<BackSeam, string> = {
  no_seam:       'No Seam',
  center_seam:   'Centre',
  princess_seam: 'Princess',
};

const SEAM_DESC: Record<BackSeam, string> = {
  no_seam:       'Single panel — minimal seams',
  center_seam:   'Centre back seam for easier fitting adjustments',
  princess_seam: 'Curved seams for a closer, sculpted fit',
};

const ALL_VENTS: BackVent[] = ['no_vent', 'center_vent', 'side_vents'];
const ALL_SEAMS: BackSeam[] = ['no_seam', 'center_seam', 'princess_seam'];

export default function BackSelector() {
  const backVent       = useAppStore((s) => s.styleOptions.backVent);
  const backSeam       = useAppStore((s) => s.styleOptions.backSeam);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  return (
    <div className="space-y-4">
      {/* Back vent */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">Back Vent</p>
        <p className="text-xs text-slate-500 mb-2">{VENT_DESC[backVent]}</p>
        <div className="flex flex-wrap gap-2">
          {ALL_VENTS.map((v) => (
            <StyleOptionCard
              key={v}
              label={VENT_LABELS[v]}
              description={VENT_DESC[v]}
              isSelected={backVent === v}
              onClick={() => setStyleOption('backVent', v)}
            >
              {VENT_SKETCHES[v]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Back seam */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">Back Seam</p>
        <p className="text-xs text-slate-500 mb-2">{SEAM_DESC[backSeam]}</p>
        <div className="flex flex-wrap gap-2">
          {ALL_SEAMS.map((s) => (
            <StyleOptionCard
              key={s}
              label={SEAM_LABELS[s]}
              description={SEAM_DESC[s]}
              isSelected={backSeam === s}
              onClick={() => setStyleOption('backSeam', s)}
            >
              {SEAM_SKETCHES[s]}
            </StyleOptionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
