// ─────────────────────────────────────────────
//  PocketSelector — chest pocket, side pockets,
//  ticket pocket toggle, pocket dimensions
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';
import type { PocketType, PocketConfig } from '../../types/style.types';
import StyleOptionCard from './StyleOptionCard';

// ── Pocket SVG Sketches ────────────────────────

const noPocket = (
  <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
    <rect x="12" y="14" width="24" height="18" rx="2" opacity="0.15" />
    <line x1="14" y1="16" x2="34" y2="30" opacity="0.4" />
    <line x1="34" y1="16" x2="14" y2="30" opacity="0.4" />
  </svg>
);

const weltPocket = (
  <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
    {/* Single welt — thin slit with welt strip */}
    <rect x="12" y="20" width="24" height="3" rx="1" fill="currentColor" fillOpacity="0.12" />
    <line x1="12" y1="21.5" x2="36" y2="21.5" />
    <line x1="12" y1="20" x2="12" y2="23" />
    <line x1="36" y1="20" x2="36" y2="23" />
  </svg>
);

const doubleWeltPocket = (
  <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
    {/* Two welt lips */}
    <rect x="12" y="18" width="24" height="8" rx="1" fill="currentColor" fillOpacity="0.1" />
    <line x1="12" y1="22" x2="36" y2="22" />
    <line x1="12" y1="18" x2="36" y2="18" />
    <line x1="12" y1="26" x2="36" y2="26" />
    <line x1="12" y1="18" x2="12" y2="26" />
    <line x1="36" y1="18" x2="36" y2="26" />
  </svg>
);

const flapPocket = (
  <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
    {/* Pocket opening */}
    <line x1="10" y1="26" x2="38" y2="26" />
    {/* Flap */}
    <path d="M10,18 L38,18 L38,26 Q24,30 10,26 Z" fill="currentColor" fillOpacity="0.12" />
    {/* Button */}
    <circle cx="24" cy="20.5" r="2" fill="currentColor" opacity="0.5" />
  </svg>
);

const patchPocket = (
  <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
    {/* Patch sewn to outside */}
    <rect x="11" y="14" width="26" height="22" rx="2" fill="currentColor" fillOpacity="0.12" />
    {/* Topstitch line */}
    <rect x="13" y="16" width="22" height="18" rx="1.5" strokeDasharray="2,1.5" opacity="0.5" />
  </svg>
);

const ticketPocket = (
  <svg viewBox="0 0 48 48" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round">
    {/* Main pocket */}
    <line x1="10" y1="30" x2="38" y2="30" />
    <path d="M10,22 L38,22 L38,30 Q24,34 10,30 Z" fill="currentColor" fillOpacity="0.1" />
    {/* Small ticket pocket above-right */}
    <line x1="28" y1="16" x2="38" y2="16" />
    <path d="M28,10 L38,10 L38,16 Q33,19 28,16 Z" fill="currentColor" fillOpacity="0.18" />
  </svg>
);

const POCKET_SKETCHES: Record<PocketType, React.ReactNode> = {
  no_pocket:          noPocket,
  welt_pocket:        weltPocket,
  double_welt_pocket: doubleWeltPocket,
  flap_pocket:        flapPocket,
  patch_pocket:       patchPocket,
  ticket_pocket:      ticketPocket,
};

const POCKET_LABELS: Record<PocketType, string> = {
  no_pocket:          'None',
  welt_pocket:        'Welt',
  double_welt_pocket: 'Jetted',
  flap_pocket:        'Flap',
  patch_pocket:       'Patch',
  ticket_pocket:      'Ticket',
};

const ALL_POCKET_TYPES: PocketType[] = [
  'no_pocket', 'welt_pocket', 'double_welt_pocket',
  'flap_pocket', 'patch_pocket', 'ticket_pocket',
];

export default function PocketSelector() {
  const pocketConfig   = useAppStore((s) => s.styleOptions.pocketConfig);
  const setStyleOption = useAppStore((s) => s.setStyleOption);

  const update = (partial: Partial<PocketConfig>) =>
    setStyleOption('pocketConfig', { ...pocketConfig, ...partial });

  return (
    <div className="space-y-5">
      {/* Chest pocket */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Chest Pocket</p>
        <div className="flex flex-wrap gap-2">
          {(['no_pocket', 'welt_pocket', 'patch_pocket'] as PocketType[]).map((p) => (
            <StyleOptionCard
              key={p}
              label={POCKET_LABELS[p]}
              isSelected={pocketConfig.chestPocket === p}
              onClick={() => update({ chestPocket: p })}
              size="sm"
            >
              {POCKET_SKETCHES[p]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Side pockets */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Side Pockets</p>
        <div className="flex flex-wrap gap-2">
          {ALL_POCKET_TYPES.map((p) => (
            <StyleOptionCard
              key={p}
              label={POCKET_LABELS[p]}
              isSelected={pocketConfig.sidePockets === p}
              onClick={() => update({ sidePockets: p })}
              size="sm"
            >
              {POCKET_SKETCHES[p]}
            </StyleOptionCard>
          ))}
        </div>
      </div>

      {/* Ticket pocket toggle */}
      {(pocketConfig.sidePockets === 'welt_pocket' ||
        pocketConfig.sidePockets === 'flap_pocket' ||
        pocketConfig.sidePockets === 'double_welt_pocket') && (
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={pocketConfig.includeTicketPocket}
              onChange={(e) => update({ includeTicketPocket: e.target.checked })}
            />
            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary-600
              peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5
              after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4
              after:transition-all" />
          </label>
          <span className="text-xs text-slate-700 font-medium">
            Include ticket pocket (above right side pocket)
          </span>
        </div>
      )}

      {/* Pocket width */}
      <div>
        <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
          <span>Pocket Width</span>
          <span className="font-mono text-primary-700">{pocketConfig.pocketWidth} cm</span>
        </label>
        <input
          type="range"
          min={10}
          max={18}
          step={0.5}
          value={pocketConfig.pocketWidth}
          onChange={(e) => update({ pocketWidth: Number(e.target.value) })}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>10 cm</span><span>18 cm</span>
        </div>
      </div>

      {/* Pocket position */}
      <div>
        <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
          <span>Position below waist</span>
          <span className="font-mono text-primary-700">{pocketConfig.pocketPosition} cm</span>
        </label>
        <input
          type="range"
          min={2}
          max={8}
          step={0.5}
          value={pocketConfig.pocketPosition}
          onChange={(e) => update({ pocketPosition: Number(e.target.value) })}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>2 cm</span><span>8 cm</span>
        </div>
      </div>
    </div>
  );
}
