// ─────────────────────────────────────────────
//  ReportTable
//  Standalone, reusable measurement comparison table.
//  Shows base-size measurements vs the user's measurements
//  with colour-coded adjustment status.
// ─────────────────────────────────────────────

import type { AdjustmentReport, PatternAdjustmentEntry } from '../../types/pattern.types';
import type { BaseSize } from '../../types/measurements.types';
import { classifyDelta, type DeltaStatus } from '../PatternEngine/PatternAdjuster';

// ─── Filter types ────────────────────────────

export type ReportFilterStatus = 'all' | 'needs_attention' | 'errors_only';

export interface ReportTableProps {
  report: AdjustmentReport;
  baseSize: BaseSize;
  filterStatus?: ReportFilterStatus;
}

// ─── Token maps ──────────────────────────────

const STATUS_BG: Record<DeltaStatus, string> = {
  ok:    'bg-emerald-50  text-emerald-700  border-emerald-200',
  warn:  'bg-amber-50    text-amber-700    border-amber-200',
  error: 'bg-red-50      text-red-700      border-red-200',
};

const STATUS_ICON: Record<DeltaStatus, string> = {
  ok:    '✓',
  warn:  '⚠',
  error: '✗',
};

const STATUS_LABEL: Record<DeltaStatus, string> = {
  ok:    'OK',
  warn:  'Large',
  error: 'Critical',
};

// ─────────────────────────────────────────────
//  ReportTable (default export)
// ─────────────────────────────────────────────

export default function ReportTable({
  report,
  baseSize,
  filterStatus = 'all',
}: ReportTableProps) {
  // Apply filter to each piece; drop pieces where no entries survive
  const visiblePieces = report.pieces
    .map((p) => ({
      ...p,
      entries: filterEntries(p.entries, filterStatus),
    }))
    .filter((p) => p.entries.length > 0);

  if (visiblePieces.length === 0) {
    return <EmptyState filterStatus={filterStatus} />;
  }

  return (
    <div className="space-y-5">
      {visiblePieces.map((p) => (
        <section
          key={p.pieceId}
          aria-labelledby={`piece-${p.pieceId}`}
          className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
        >
          {/* Piece header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3
              id={`piece-${p.pieceId}`}
              className="font-semibold text-slate-800 text-sm"
            >
              {p.pieceName}
            </h3>
            <StatusBadgeRow entries={p.entries} />
          </div>

          {/* Data table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th
                    scope="col"
                    className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-2/5"
                  >
                    Pattern Piece / Measurement
                  </th>
                  <th
                    scope="col"
                    className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Base ({baseSize})
                  </th>
                  <th
                    scope="col"
                    className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Your Size
                  </th>
                  <th
                    scope="col"
                    className="text-center px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36"
                  >
                    Adjustment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {p.entries.map((entry) => (
                  <AdjustmentRow key={entry.measurementKey} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  AdjustmentRow
// ─────────────────────────────────────────────

function AdjustmentRow({ entry }: { entry: PatternAdjustmentEntry }) {
  const status = classifyDelta(entry.delta);
  const isZero = entry.delta === 0;

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      {/* Measurement name */}
      <td className="px-5 py-2.5 text-slate-700">{entry.label}</td>

      {/* Base value */}
      <td className="px-5 py-2.5 text-right text-slate-500 font-mono tabular-nums">
        {entry.baseValue.toFixed(1)} cm
      </td>

      {/* User value */}
      <td className="px-5 py-2.5 text-right text-slate-800 font-mono tabular-nums font-medium">
        {entry.userValue.toFixed(1)} cm
      </td>

      {/* Adjustment badge */}
      <td className="px-5 py-2.5 text-center">
        {isZero ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
            —&nbsp; No change
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BG[status]}`}
          >
            <span aria-hidden="true">{STATUS_ICON[status]}</span>
            <span className="font-mono tabular-nums">
              {entry.delta > 0 ? '+' : ''}
              {entry.delta.toFixed(1)} cm
            </span>
          </span>
        )}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  StatusBadgeRow — small count pills in piece header
// ─────────────────────────────────────────────

function StatusBadgeRow({ entries }: { entries: PatternAdjustmentEntry[] }) {
  const counts = { ok: 0, warn: 0, error: 0 };
  for (const e of entries) {
    counts[classifyDelta(e.delta)]++;
  }

  return (
    <div className="flex items-center gap-1.5">
      {(['error', 'warn', 'ok'] as DeltaStatus[])
        .filter((s) => counts[s] > 0)
        .map((s) => (
          <span
            key={s}
            title={`${counts[s]} ${STATUS_LABEL[s]}`}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_BG[s]}`}
          >
            {STATUS_ICON[s]} {counts[s]}
          </span>
        ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  EmptyState
// ─────────────────────────────────────────────

function EmptyState({ filterStatus }: { filterStatus: ReportFilterStatus }) {
  const messages: Record<ReportFilterStatus, { title: string; body: string }> = {
    all: {
      title: 'No adjustment data',
      body: 'Generate pattern pieces to see measurement comparisons.',
    },
    needs_attention: {
      title: 'No large adjustments',
      body: 'All measurements are within the normal range (≤ 5 cm from base).',
    },
    errors_only: {
      title: 'No critical adjustments',
      body: 'No measurements exceed 10 cm from the base size — good fit!',
    },
  };

  const { title, body } = messages[filterStatus];

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl text-emerald-600">
        ✓
      </div>
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 max-w-xs">{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Helper: filter entries by filterStatus
// ─────────────────────────────────────────────

function filterEntries(
  entries: PatternAdjustmentEntry[],
  filter: ReportFilterStatus,
): PatternAdjustmentEntry[] {
  if (filter === 'all') return entries;
  return entries.filter((e) => {
    const s = classifyDelta(e.delta);
    if (filter === 'errors_only') return s === 'error';
    // needs_attention = warn or error
    return s === 'warn' || s === 'error';
  });
}
