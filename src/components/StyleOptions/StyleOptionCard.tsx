// ─────────────────────────────────────────────
//  StyleOptionCard — shared selectable card
//  Used by all style selectors for consistent UX
// ─────────────────────────────────────────────

interface StyleOptionCardProps {
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode; // SVG sketch or icon
  size?: 'sm' | 'md';
}

export default function StyleOptionCard({
  label,
  description,
  isSelected,
  onClick,
  children,
  size = 'md',
}: StyleOptionCardProps) {
  const sketchSize = size === 'sm' ? 44 : 56;

  return (
    <button
      type="button"
      onClick={onClick}
      title={description ?? label}
      className={[
        'flex flex-col items-center gap-1.5 rounded-lg border-2 transition-all focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
        size === 'sm' ? 'p-2 w-20' : 'p-3 w-24',
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50',
      ].join(' ')}
      aria-pressed={isSelected}
    >
      {/* Sketch area */}
      <div
        className={[
          'flex items-center justify-center rounded',
          isSelected ? 'text-primary-600' : 'text-slate-500',
        ].join(' ')}
        style={{ width: sketchSize, height: sketchSize }}
      >
        {children}
      </div>

      {/* Label */}
      <span
        className={[
          'text-center leading-tight font-medium',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
          isSelected ? 'text-primary-700' : 'text-slate-600',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );
}
