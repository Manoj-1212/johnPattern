// ─────────────────────────────────────────────
//  AdjustmentPanel — Module 5 main view
//  Displays the full measurement comparison &
//  adjustment report for all pattern pieces.
// ─────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { buildAdjustmentReport, classifyDelta } from '../PatternEngine/PatternAdjuster';
import ReportTable, { type ReportFilterStatus } from './ReportTable';

// ─────────────────────────────────────────────
//  AdjustmentPanel
// ─────────────────────────────────────────────

export default function AdjustmentPanel() {
  const measurements  = useAppStore((s) => s.measurements);
  const baseSize      = useAppStore((s) => s.baseSize);
  const setBaseSize   = useAppStore((s) => s.setBaseSize);
  const setActiveView = useAppStore((s) => s.setActiveView);

  const [filter, setFilter] = useState<ReportFilterStatus>('all');

  // ── Compute report ──────────────────────────
  const report = useMemo(
    () => buildAdjustmentReport(measurements, baseSize),
    [measurements, baseSize],
  );

  // ── Aggregate stats ─────────────────────────
  const stats = useMemo(() => {
    let total = 0;
    let ok = 0;
    let warn = 0;
    let error = 0;
    for (const piece of report.pieces) {
      for (const entry of piece.entries) {
        total++;
        const s = classifyDelta(entry.delta);
        if (s === 'ok') ok++;
        else if (s === 'warn') warn++;
        else error++;
      }
    }
    return { total, ok, warn, error };
  }, [report]);

  // ── Filter tab definitions ──────────────────
  const filterTabs: { id: ReportFilterStatus; label: string; count: number | null }[] = [
    { id: 'all',              label: 'All measurements', count: stats.total },
    { id: 'needs_attention',  label: 'Needs attention',  count: stats.warn + stats.error },
    { id: 'errors_only',      label: 'Critical only',    count: stats.error },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ─────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('pattern')}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ← Pattern
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            Measurement Comparison &amp; Adjustment Report
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Base size selector */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
            <span className="text-slate-500">Base size:</span>
            {(['S', 'M', 'L', 'XL'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setBaseSize(sz)}
                className={[
                  'px-2 py-0.5 rounded text-xs font-semibold transition-colors',
                  baseSize === sz
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveView('style')}
            className="px-4 py-1.5 rounded bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Style →
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ───────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total checks"
          value={stats.total}
          colorClass="bg-slate-50 border-slate-200 text-slate-700"
          icon={
            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 000 2H6a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-.01a1 1 0 100-2H14a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/>
            </svg>
          }
        />
        <StatCard
          label="Within range"
          value={stats.ok}
          colorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
          icon={
            <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          }
        />
        <StatCard
          label="Large (5–10 cm)"
          value={stats.warn}
          colorClass="bg-amber-50 border-amber-200 text-amber-700"
          icon={
            <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          }
        />
        <StatCard
          label="Critical (> 10 cm)"
          value={stats.error}
          colorClass="bg-red-50 border-red-200 text-red-700"
          icon={
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
          }
        />
      </div>

      {/* ── Warning banner (shown only when warnings / errors exist) ─── */}
      {stats.warn > 0 && stats.error === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
          <p>
            <strong>{stats.warn} adjustment{stats.warn > 1 ? 's' : ''}</strong> exceed 5 cm from the
            base size. These are normal for a custom fit but may benefit from a professional
            toile fitting before cutting.
          </p>
        </div>
      )}
      {stats.error > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <span className="mt-0.5 shrink-0 text-red-500">✗</span>
          <p>
            <strong>{stats.error} adjustment{stats.error > 1 ? 's' : ''}</strong> exceed 10 cm from
            the base size. Please verify these measurements — extreme deltas may indicate an
            error in the input. A professional fitting is strongly recommended.
          </p>
        </div>
      )}

      {/* ── Filter tabs ─────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              filter === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== null && (
              <span
                className={[
                  'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                  filter === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-100 text-slate-500',
                ].join(' ')}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Legend ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 px-1">
        <LegendItem
          colorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
          icon="✓"
          label="Within normal range (0–5 cm)"
        />
        <LegendItem
          colorClass="bg-amber-50 text-amber-700 border-amber-200"
          icon="⚠"
          label="Large adjustment (5–10 cm)"
        />
        <LegendItem
          colorClass="bg-red-50 text-red-700 border-red-200"
          icon="✗"
          label="Critical adjustment (&gt; 10 cm)"
        />
      </div>

      {/* ── Report table ─────────────────────────── */}
      <ReportTable report={report} baseSize={baseSize} filterStatus={filter} />

      {/* ── Footer navigation ────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setActiveView('pattern')}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          ← Back to Pattern
        </button>

        <button
          type="button"
          onClick={() => setActiveView('style')}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Continue to Style →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function StatCard({
  label,
  value,
  colorClass,
  icon,
}: {
  label: string;
  value: number;
  colorClass: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colorClass}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-0.5 opacity-75">{label}</p>
      </div>
    </div>
  );
}

function LegendItem({
  colorClass,
  icon,
  label,
}: {
  colorClass: string;
  icon: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
