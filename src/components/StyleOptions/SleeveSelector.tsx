// ─────────────────────────────────────────────
//  SleeveSelector — sleeve style + cuff
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { SleeveStyle, CuffStyle, CuffConfig } from '../../types/style.types';
import StyleOptionCard from './StyleOptionCard';

// ── Sleeve sketches ───────────────────────────

const SLEEVE_SKETCHES: Record<SleeveStyle, React.ReactNode> = {
  two_piece_sleeve: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Two-piece: upper + under seam lines */}
      {/* Cap curve */}
      <path d="M12,14 C14,6 34,6 36,14" fill="none" />
      {/* Side seams */}
      <line x1="12" y1="14" x2="16" y2="44" />
      <line x1="36" y1="14" x2="32" y2="44" />
      {/* Hem */}
      <line x1="16" y1="44" x2="32" y2="44" />
      {/* Under-sleeve seam (shows two-piece construction) */}
      <path d="M20,14 L20,44" strokeDasharray="2,1.5" opacity="0.5" />
    </svg>
  ),
  one_piece_sleeve: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* One-piece: simple tapered tube */}
      <path d="M10,14 C12,6 36,6 38,14" fill="none" />
      <line x1="10" y1="14" x2="14" y2="44" />
      <line x1="38" y1="14" x2="34" y2="44" />
      <line x1="14" y1="44" x2="34" y2="44" />
      {/* No extra seam lines */}
    </svg>
  ),
  raglan_sleeve: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* Raglan diagonal seam from underarm to collar */}
      <path d="M16,6 C18,10 14,18 12,22" fill="none" />
      <path d="M32,6 C30,10 34,18 36,22" fill="none" />
      <line x1="12" y1="22" x2="16" y2="44" />
      <line x1="36" y1="22" x2="32" y2="44" />
      <line x1="16" y1="44" x2="32" y2="44" />
      {/* Diagonal seam lines from neck corners */}
      <path d="M18,8 L12,22" strokeDasharray="3,2" />
      <path d="M30,8 L36,22" strokeDasharray="3,2" />
    </svg>
  ),
};

const SLEEVE_LABELS: Record<SleeveStyle, string> = {
  two_piece_sleeve: '2-Piece',
  one_piece_sleeve: '1-Piece',
  raglan_sleeve:    'Raglan',
};

const SLEEVE_DESC: Record<SleeveStyle, string> = {
  two_piece_sleeve: 'Classic tailored jacket sleeve — precise fit',
  one_piece_sleeve: 'Simpler construction, slightly less fitted',
  raglan_sleeve:    'Diagonal seam from underarm to collar — sporty',
};

// ── Cuff sketches ─────────────────────────────

const CUFF_SKETCHES: Record<CuffStyle, React.ReactNode> = {
  functioning_buttons: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Sleeve wrist with functional button slit */}
      <line x1="10" y1="36" x2="38" y2="36" />
      {/* Button slit */}
      <line x1="30" y1="30" x2="30" y2="44" strokeDasharray="2,2" opacity="0.5" />
      {/* 3 buttons */}
      <circle cx="26" cy="38" r="2" fill="currentColor" />
      <circle cx="31" cy="38" r="2" fill="currentColor" />
      <circle cx="36" cy="38" r="2" fill="currentColor" />
    </svg>
  ),
  decorative_buttons: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Sleeve wrist — buttons sewn closed */}
      <line x1="10" y1="36" x2="38" y2="36" />
      {/* Buttons only, no slit */}
      <circle cx="26" cy="38" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="31" cy="38" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="36" cy="38" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  plain_hem: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Plain hem line, no buttons */}
      <line x1="10" y1="38" x2="38" y2="38" />
      <line x1="10" y1="34" x2="38" y2="34" strokeDasharray="2,2" opacity="0.4" />
    </svg>
  ),
  turnback_cuff: (
    <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
      {/* Turnback cuff — folded back section */}
      <line x1="10" y1="30" x2="38" y2="30" />
      {/* Fold line */}
      <line x1="10" y1="38" x2="38" y2="38" />
      {/* Folded section fill */}
      <rect x="10" y="30" width="28" height="8" fill="currentColor" fillOpacity="0.1" />
      {/* Button on cuff */}
      <circle cx="24" cy="41" r="2" fill="currentColor" />
    </svg>
  ),
};

const CUFF_LABELS: Record<CuffStyle, string> = {
  functioning_buttons: 'Working Btns',
  decorative_buttons:  'Decorative',
  plain_hem:           'Plain Hem',
  turnback_cuff:       'Turnback',
};

const ALL_SLEEVE_STYLES: SleeveStyle[] = ['two_piece_sleeve', 'one_piece_sleeve', 'raglan_sleeve'];
const ALL_CUFF_STYLES: CuffStyle[]     = ['functioning_buttons', 'decorative_buttons', 'plain_hem', 'turnback_cuff'];

export default function SleeveSelector() {
  const sleeveStyle    = useAppStore((s) => s.styleOptions.sleeveStyle);
  const cuffConfig     = useAppStore((s) => s.styleOptions.cuffConfig);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  const updateCuff = (partial: Partial<CuffConfig>) =>
    setStyleOption('cuffConfig', { ...cuffConfig, ...partial });

  return (
    <div className="space-y-4">
      {/* Sleeve style */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">Sleeve Construction</p>
        <p className="text-xs text-slate-500 mb-2">{SLEEVE_DESC[sleeveStyle]}</p>
        <div className="flex flex-wrap gap-2">
          {ALL_SLEEVE_STYLES.map((s) => (
            <StyleOptionCard
              key={s}
              label={SLEEVE_LABELS[s]}
              description={SLEEVE_DESC[s]}
              isSelected={sleeveStyle === s}
              onClick={() => setStyleOption('sleeveStyle', s)}
            >
              {SLEEVE_SKETCHES[s]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Cuff style */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Cuff / Hem Style</p>
        <div className="flex flex-wrap gap-2">
          {ALL_CUFF_STYLES.map((c) => (
            <StyleOptionCard
              key={c}
              label={CUFF_LABELS[c]}
              isSelected={cuffConfig.style === c}
              onClick={() => updateCuff({ style: c })}
              size="sm"
            >
              {CUFF_SKETCHES[c]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Button count (when buttons are shown) */}
      {cuffConfig.style !== 'plain_hem' && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">
            Cuff Button Count
          </p>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateCuff({ buttonCount: n })}
                className={[
                  'w-9 h-9 rounded-lg border text-sm font-medium transition-colors',
                  cuffConfig.buttonCount === n
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
