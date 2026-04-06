import type { BaseSize } from '../../types/measurements.types';
import { useAppStore } from '../../store/appStore';
import { STANDARD_SIZES } from '../../data/standardSizes';

// ─────────────────────────────────────────────
//  SizePresets — quick-fill buttons S/M/L/XL
// ─────────────────────────────────────────────

const SIZES: BaseSize[] = ['S', 'M', 'L', 'XL'];

const SIZE_DESCRIPTIONS: Record<BaseSize, string> = {
  S:  `Chest ${STANDARD_SIZES.S.chest} cm`,
  M:  `Chest ${STANDARD_SIZES.M.chest} cm`,
  L:  `Chest ${STANDARD_SIZES.L.chest} cm`,
  XL: `Chest ${STANDARD_SIZES.XL.chest} cm`,
};

export default function SizePresets() {
  const baseSize = useAppStore((s) => s.baseSize);
  const setBaseSize = useAppStore((s) => s.setBaseSize);
  const setValidationErrors = useAppStore((s) => s.setValidationErrors);

  function handleSelect(size: BaseSize) {
    setBaseSize(size);
    setValidationErrors({});
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Quick-fill with standard size
      </p>
      <div className="flex gap-2 flex-wrap">
        {SIZES.map((size) => {
          const isActive = baseSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => handleSelect(size)}
              className={[
                'group flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isActive
                  ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:bg-primary-50',
              ].join(' ')}
              aria-pressed={isActive}
            >
              <span className="text-lg font-bold leading-none">{size}</span>
              <span className="text-[10px] mt-0.5 text-slate-400 group-hover:text-primary-600">
                {SIZE_DESCRIPTIONS[size]}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        Selecting a size pre-fills all fields. You can still edit individual values.
      </p>
    </div>
  );
}
