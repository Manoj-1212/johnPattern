// ─────────────────────────────────────────────
//  LapelSelector — lapel style + width
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { LapelStyle, LapelWidth } from '../../types/style.types';
import StyleOptionCard from './StyleOptionCard';

// ── Lapel style sketches ──────────────────────

const LAPEL_SKETCHES: Record<LapelStyle, React.ReactNode> = {
  notched: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <path d="M24,6 L14,20 L19,26 L24,20 L29,26 L34,20 Z" fill="currentColor" fillOpacity="0.1" />
      <line x1="19" y1="26" x2="24" y2="20" />
      <line x1="29" y1="26" x2="24" y2="20" />
    </svg>
  ),
  peak: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <path d="M24,6 L9,16 L16,28 L24,18 L32,28 L39,16 Z" fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  shawl: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <path d="M24,6 C18,10 12,18 16,28 L24,20 L32,28 C36,18 30,10 24,6Z" fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  none: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      {/* Flat V-neck, no lapel fold */}
      <path d="M18,6 L24,24 L30,6" fill="none" />
      <line x1="14" y1="8" x2="34" y2="8" strokeDasharray="2,2" opacity="0.4" />
    </svg>
  ),
};

const LAPEL_STYLE_LABELS: Record<LapelStyle, string> = {
  notched: 'Notched',
  peak:    'Peak',
  shawl:   'Shawl',
  none:    'No Lapel',
};

// ── Width sketches ─────────────────────────────

const WIDTH_SKETCHES: Record<LapelWidth, React.ReactNode> = {
  narrow: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      {/* Narrow lapel — thin fold */}
      <path d="M22,4 L18,20 L22,22 L24,14 L26,22 L30,20 L26,4 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="22" y1="22" x2="26" y2="22" />
    </svg>
  ),
  medium: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <path d="M20,4 L14,20 L20,24 L24,14 L28,24 L34,20 L28,4 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="20" y1="24" x2="28" y2="24" />
    </svg>
  ),
  wide: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
      <path d="M18,4 L8,22 L18,28 L24,14 L30,28 L40,22 L30,4 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="18" y1="28" x2="30" y2="28" />
    </svg>
  ),
};

const LAPEL_STYLES: LapelStyle[] = ['notched', 'peak', 'shawl', 'none'];
const LAPEL_WIDTHS: LapelWidth[]  = ['narrow', 'medium', 'wide'];

export default function LapelSelector() {
  const lapelStyle  = useAppStore((s) => s.styleOptions.lapelStyle);
  const lapelWidth  = useAppStore((s) => s.styleOptions.lapelWidth);
  const collarType  = useAppStore((s) => s.styleOptions.collarType);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  // With mandarin/band/no/nehru/chinese collars lapels are disabled
  const lapelDisabled = ['mandarin_collar','chinese_collar','nehru_collar','band_collar','no_collar']
    .includes(collarType);

  return (
    <div className="space-y-4">
      {/* Style */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Lapel Style</p>
        {lapelDisabled && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2">
            Lapel not applicable for this collar type
          </p>
        )}
        <div className={`flex flex-wrap gap-2 ${lapelDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {LAPEL_STYLES.map((s) => (
            <StyleOptionCard
              key={s}
              label={LAPEL_STYLE_LABELS[s]}
              isSelected={lapelStyle === s}
              onClick={() => setStyleOption('lapelStyle', s)}
              size="sm"
            >
              {LAPEL_SKETCHES[s]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Width */}
      {lapelStyle !== 'none' && !lapelDisabled && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Lapel Width</p>
          <div className="flex flex-wrap gap-2">
            {LAPEL_WIDTHS.map((w) => (
              <StyleOptionCard
                key={w}
                label={w.charAt(0).toUpperCase() + w.slice(1)}
                isSelected={lapelWidth === w}
                onClick={() => setStyleOption('lapelWidth', w)}
                size="sm"
              >
                {WIDTH_SKETCHES[w]}
              </StyleOptionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
