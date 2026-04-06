// ─────────────────────────────────────────────
//  ButtonSelector — button layout + config
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { ButtonStyle, ButtonConfig } from '../../types/style.types';
import StyleOptionCard from './StyleOptionCard';

// ── Helpers ────────────────────────────────────

function ButtonDots({ cols, rows, hidden }: { cols: number; rows: number; hidden?: boolean }) {
  const gap = 8;
  const startX = 24 - ((cols - 1) * gap) / 2;
  const startY = 28 - ((rows - 1) * gap) / 2;
  const dots = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      cx: startX + c * gap,
      cy: startY + r * gap,
    }))
  ).flat();

  return (
    <>
      {/* Jacket front edges */}
      <line x1="20" y1="6" x2="16" y2="46" stroke="currentColor" strokeWidth="1.4" />
      <line x1="28" y1="6" x2="32" y2="46" stroke="currentColor" strokeWidth="1.4" />

      {hidden ? (
        /* Hidden placket — vertical fold line, no visible buttons */
        <>
          <line x1="22" y1="10" x2="22" y2="44" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
          <text x="24" y="30" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.6" fontFamily="sans-serif">fly</text>
        </>
      ) : (
        dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="2.4" fill="currentColor" />
        ))
      )}
    </>
  );
}

const BUTTON_SKETCHES: Record<ButtonStyle, React.ReactNode> = {
  single_breasted_1btn: (
    <svg viewBox="0 0 48 48" fill="none" strokeLinecap="round"><ButtonDots cols={1} rows={1} /></svg>
  ),
  single_breasted_2btn: (
    <svg viewBox="0 0 48 48" fill="none" strokeLinecap="round"><ButtonDots cols={1} rows={2} /></svg>
  ),
  single_breasted_3btn: (
    <svg viewBox="0 0 48 48" fill="none" strokeLinecap="round"><ButtonDots cols={1} rows={3} /></svg>
  ),
  double_breasted_4btn: (
    <svg viewBox="0 0 48 48" fill="none" strokeLinecap="round"><ButtonDots cols={2} rows={2} /></svg>
  ),
  double_breasted_6btn: (
    <svg viewBox="0 0 48 48" fill="none" strokeLinecap="round"><ButtonDots cols={2} rows={3} /></svg>
  ),
  hidden_placket: (
    <svg viewBox="0 0 48 48" fill="none" strokeLinecap="round"><ButtonDots cols={1} rows={2} hidden /></svg>
  ),
};

const BUTTON_LABELS: Record<ButtonStyle, string> = {
  single_breasted_1btn: 'SB 1-btn',
  single_breasted_2btn: 'SB 2-btn',
  single_breasted_3btn: 'SB 3-btn',
  double_breasted_4btn: 'DB 4-btn',
  double_breasted_6btn: 'DB 6-btn',
  hidden_placket:       'Hidden',
};

const BUTTON_COUNT: Record<ButtonStyle, number> = {
  single_breasted_1btn: 1,
  single_breasted_2btn: 2,
  single_breasted_3btn: 3,
  double_breasted_4btn: 4,
  double_breasted_6btn: 6,
  hidden_placket:       2,
};

const ALL_BUTTON_STYLES: ButtonStyle[] = [
  'single_breasted_1btn', 'single_breasted_2btn', 'single_breasted_3btn',
  'double_breasted_4btn', 'double_breasted_6btn', 'hidden_placket',
];

export default function ButtonSelector() {
  const buttonConfig   = useAppStore((s) => s.styleOptions.buttonConfig);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  const update = (partial: Partial<ButtonConfig>) =>
    setStyleOption('buttonConfig', { ...buttonConfig, ...partial });

  return (
    <div className="space-y-4">
      {/* Layout */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Layout</p>
        <div className="flex flex-wrap gap-2">
          {ALL_BUTTON_STYLES.map((s) => (
            <StyleOptionCard
              key={s}
              label={BUTTON_LABELS[s]}
              isSelected={buttonConfig.style === s}
              onClick={() =>
                update({ style: s, buttonCount: BUTTON_COUNT[s] })
              }
              size="sm"
            >
              {BUTTON_SKETCHES[s]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Button size */}
      <div>
        <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
          <span>Button diameter</span>
          <span className="font-mono text-primary-700">{buttonConfig.buttonSize} mm</span>
        </label>
        <input
          type="range"
          min={15}
          max={25}
          step={1}
          value={buttonConfig.buttonSize}
          onChange={(e) => update({ buttonSize: Number(e.target.value) })}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>15 mm</span><span>25 mm</span>
        </div>
      </div>

      {/* Buttonhole orientation */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Buttonhole Orientation</p>
        <div className="flex gap-3">
          {(['horizontal', 'vertical'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => update({ buttonholeType: o })}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
                buttonConfig.buttonholeType === o
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {/* Mini buttonhole indicator */}
              <svg viewBox="0 0 20 20" width="18" height="18" stroke="currentColor" strokeWidth="1.5" fill="none">
                {o === 'horizontal'
                  ? <><rect x="3" y="8" width="14" height="4" rx="2" /><line x1="3" y1="10" x2="17" y2="10" strokeDasharray="2,2" /></>
                  : <><rect x="8" y="3" width="4" height="14" rx="2" /><line x1="10" y1="3" x2="10" y2="17" strokeDasharray="2,2" /></>
                }
              </svg>
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
