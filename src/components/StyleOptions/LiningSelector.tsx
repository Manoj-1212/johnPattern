// ─────────────────────────────────────────────
//  LiningSelector — lining type + colour picker
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { LiningConfig } from '../../types/style.types';

type LiningOption = 'fullyLined' | 'halfLined' | 'noLining';

const LINING_OPTIONS: { key: LiningOption; label: string; description: string }[] = [
  {
    key: 'fullyLined',
    label: 'Fully Lined',
    description: 'Entire jacket interior lined — most comfortable, premium finish',
  },
  {
    key: 'halfLined',
    label: 'Half Lined',
    description: 'Back body lined only — lighter, cooler wear',
  },
  {
    key: 'noLining',
    label: 'Unlined',
    description: 'No lining — casual style, minimal construction',
  },
];

// Preset lining colour swatches
const LINING_COLOURS = [
  { label: 'Deep Purple',  hex: '#5b4a8a' },
  { label: 'Navy Blue',    hex: '#1e3a5f' },
  { label: 'Burgundy',     hex: '#7b2d3e' },
  { label: 'Forest Green', hex: '#2d5a27' },
  { label: 'Caramel',      hex: '#c4813a' },
  { label: 'Ivory',        hex: '#f5f0e8' },
  { label: 'Charcoal',     hex: '#3a3a3a' },
  { label: 'Midnight',     hex: '#121212' },
];

export default function LiningSelector() {
  const liningConfig   = useAppStore((s) => s.styleOptions.liningConfig);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  const update = (partial: Partial<LiningConfig>) =>
    setStyleOption('liningConfig', { ...liningConfig, ...partial });

  // Determine active key
  const activeKey: LiningOption = liningConfig.fullyLined
    ? 'fullyLined'
    : liningConfig.halfLined
    ? 'halfLined'
    : 'noLining';

  const selectLining = (key: LiningOption) =>
    update({
      fullyLined: key === 'fullyLined',
      halfLined:  key === 'halfLined',
      noLining:   key === 'noLining',
    });

  return (
    <div className="space-y-4">
      {/* Lining type */}
      <div className="space-y-2">
        {LINING_OPTIONS.map(({ key, label, description }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectLining(key)}
            className={[
              'w-full text-left px-4 py-3 rounded-lg border-2 transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
              activeKey === key
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              {/* Radio dot */}
              <span className={[
                'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                activeKey === key
                  ? 'border-primary-600'
                  : 'border-slate-300',
              ].join(' ')}>
                {activeKey === key && (
                  <span className="w-2 h-2 rounded-full bg-primary-600" />
                )}
              </span>
              <div>
                <p className={`text-sm font-medium ${activeKey === key ? 'text-primary-800' : 'text-slate-700'}`}>
                  {label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lining colour (only when lined) */}
      {!liningConfig.noLining && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">Lining Colour</p>
          <div className="flex flex-wrap gap-2">
            {LINING_COLOURS.map(({ label, hex }) => (
              <button
                key={hex}
                type="button"
                title={label}
                onClick={() => update({ liningColor: hex })}
                className={[
                  'w-8 h-8 rounded-full border-2 transition-all focus:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
                  liningConfig.liningColor === hex
                    ? 'border-primary-600 scale-110 shadow-md'
                    : 'border-slate-200 hover:scale-105',
                ].join(' ')}
                style={{ backgroundColor: hex }}
                aria-label={label}
                aria-pressed={liningConfig.liningColor === hex}
              />
            ))}
            {/* Custom colour input */}
            <label
              className="w-8 h-8 rounded-full border-2 border-slate-300 border-dashed flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
              title="Custom colour"
            >
              <span className="text-slate-400 text-lg leading-none">+</span>
              <input
                type="color"
                className="sr-only"
                value={liningConfig.liningColor}
                onChange={(e) => update({ liningColor: e.target.value })}
              />
            </label>
          </div>

          {/* Preview swatch */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border border-slate-200 shadow-inner"
              style={{ backgroundColor: liningConfig.liningColor }}
            />
            <div>
              <p className="text-xs font-medium text-slate-700">Preview</p>
              <p className="text-xs text-slate-500 font-mono">{liningConfig.liningColor}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
