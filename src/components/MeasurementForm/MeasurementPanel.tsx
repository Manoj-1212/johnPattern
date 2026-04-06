import { useState } from 'react';
import SizePresets from './SizePresets';
import MeasurementForm from './MeasurementForm';
import MeasurementDiagram from './MeasurementDiagram';
import type { MeasurementGroup } from '../../types/measurements.types';

// ─────────────────────────────────────────────
//  MeasurementPanel — two-panel layout
//  Left: presets + form  |  Right: SVG diagram
// ─────────────────────────────────────────────

export default function MeasurementPanel() {
  const [activeGroup, setActiveGroup] = useState<MeasurementGroup | null>(null);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* ── Left panel: form ───────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <SizePresets />
        <hr className="border-slate-200" />
        <MeasurementForm onActiveGroupChange={setActiveGroup} />
      </div>

      {/* ── Right panel: diagram ───────────────── */}
      <aside
        className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col items-center gap-3 sticky top-6 self-start"
        aria-label="Measurement reference diagram"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 self-start">
          Where to measure
        </p>
        <div className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <MeasurementDiagram highlightGroup={activeGroup ?? undefined} />
        </div>
        <p className="text-xs text-slate-400 text-center">
          Focus a field to highlight the corresponding measurement on the diagram.
        </p>
      </aside>
    </div>
  );
}
