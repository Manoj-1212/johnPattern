import { useId, useState, useCallback } from 'react';
import type { BodyMeasurements, MeasurementGroup } from '../../types/measurements.types';
import { useAppStore } from '../../store/appStore';
import { MEASUREMENT_FIELDS, GROUP_LABELS } from '../../data/patternPieceConfig';
import { cmToDisplayValue, parseInputToCm } from '../../utils/measurementConverter';
import { validateMeasurements } from '../../utils/measurementValidator';

// ─────────────────────────────────────────────
//  Single measurement input field
// ─────────────────────────────────────────────

interface FieldProps {
  fieldKey: keyof BodyMeasurements;
  label: string;
  description: string;
  optional?: boolean;
  error?: string;
  value: number | undefined;
  unit: 'cm' | 'in';
  min: number;
  max: number;
  onFocus: (group: MeasurementGroup) => void;
  group: MeasurementGroup;
}

function MeasurementField({
  fieldKey, label, description, optional, error,
  value, unit, min, max, onFocus, group,
}: FieldProps) {
  const setMeasurements = useAppStore((s) => s.setMeasurements);
  const setValidationErrors = useAppStore((s) => s.setValidationErrors);
  const measurements = useAppStore((s) => s.measurements);
  const inputId = useId();

  const displayValue = value !== undefined
    ? cmToDisplayValue(value, unit)
    : '';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cm = parseInputToCm(raw, unit);
    setMeasurements({ [fieldKey]: cm } as Partial<BodyMeasurements>);
  }

  function handleBlur() {
    const errors = validateMeasurements(measurements);
    setValidationErrors(errors);
  }

  const unitLabel = unit === 'cm' ? 'cm' : 'in';

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
          {optional && (
            <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>
          )}
        </label>
        {error && (
          <span role="alert" className="text-xs text-red-500">{error}</span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-snug">{description}</p>
      <div className="relative mt-1">
        <input
          id={inputId}
          type="number"
          step={unit === 'cm' ? '0.5' : '0.25'}
          min={unit === 'cm' ? min : undefined}
          max={unit === 'cm' ? max : undefined}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => onFocus(group)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={!!error}
          className={[
            'w-full rounded-md border px-3 py-1.5 pr-12 text-sm shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 transition',
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-slate-300 bg-white hover:border-slate-400',
          ].join(' ')}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {unitLabel}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Group section with collapsible header
// ─────────────────────────────────────────────

interface GroupProps {
  groupKey: MeasurementGroup;
  onGroupFocus: (group: MeasurementGroup) => void;
}

function MeasurementGroup({ groupKey, onGroupFocus }: GroupProps) {
  const [open, setOpen] = useState(true);
  const measurements = useAppStore((s) => s.measurements);
  const validationErrors = useAppStore((s) => s.validationErrors);
  const unit = useAppStore((s) => s.unit);

  const fields = MEASUREMENT_FIELDS.filter((f) => f.group === groupKey);
  const groupError = fields.some((f) => validationErrors[f.key]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        className={[
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'font-semibold text-sm transition-colors',
          groupError
            ? 'bg-red-50 text-red-700'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
        ].join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {GROUP_LABELS[groupKey]}
          {groupError && (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" aria-label="has errors" />
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white">
          {fields.map((field) => (
            <MeasurementField
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              description={field.description}
              optional={field.optional}
              error={validationErrors[field.key]}
              value={measurements[field.key]}
              unit={unit}
              min={field.min}
              max={field.max}
              group={field.group}
              onFocus={onGroupFocus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Unit Toggle
// ─────────────────────────────────────────────

function UnitToggle() {
  const unit = useAppStore((s) => s.unit);
  const setUnit = useAppStore((s) => s.setUnit);

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 overflow-hidden text-sm font-medium">
      {(['cm', 'in'] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          className={[
            'px-3 py-1.5 transition-colors',
            unit === u
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50',
          ].join(' ')}
          aria-pressed={unit === u}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main MeasurementForm
// ─────────────────────────────────────────────

interface MeasurementFormProps {
  onActiveGroupChange?: (group: MeasurementGroup | null) => void;
}

const GROUPS: MeasurementGroup[] = [
  'circumferences',
  'lengths',
  'widths',
  'arm',
  'height',
  'advanced',
];

export default function MeasurementForm({ onActiveGroupChange }: MeasurementFormProps) {
  const measurements = useAppStore((s) => s.measurements);
  const setValidationErrors = useAppStore((s) => s.setValidationErrors);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const resetMeasurements = useAppStore((s) => s.resetMeasurements);

  const handleGroupFocus = useCallback(
    (group: MeasurementGroup) => onActiveGroupChange?.(group),
    [onActiveGroupChange],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateMeasurements(measurements);
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setActiveView('mannequin');
    } else {
      // Scroll to first error
      const firstErrorEl = document.querySelector('[aria-invalid="true"]');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Body Measurements</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter measurements in the fields below. All values drive pattern generation.
          </p>
        </div>
        <UnitToggle />
      </div>

      {/* Measurement groups */}
      <div className="flex flex-col gap-3">
        {GROUPS.map((g) => (
          <MeasurementGroup key={g} groupKey={g} onGroupFocus={handleGroupFocus} />
        ))}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            resetMeasurements();
            setValidationErrors({});
            onActiveGroupChange?.(null);
          }}
          className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
        >
          Reset to L default
        </button>

        <button
          type="submit"
          className={[
            'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold',
            'bg-primary-600 text-white shadow-sm',
            'hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'transition-colors',
          ].join(' ')}
        >
          Generate Mannequin
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
