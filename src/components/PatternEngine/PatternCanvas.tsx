import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { computeAdjustedPieces, buildAdjustmentReport, classifyDelta } from './PatternAdjuster';
import PatternPiece from './PatternPiece';
import type { AdjustedPatternPiece } from '../../types/pattern.types';

// ─────────────────────────────────────────────
//  PatternCanvas
//  Full pattern view: flat pieces grid + side panel
//  with adjustment report and controls.
// ─────────────────────────────────────────────

type TabId = 'flat' | 'report';

const PIECE_W = 260;
const PIECE_H = 340;

const deltaClass: Record<string, string> = {
  ok:    'text-emerald-700 bg-emerald-50',
  warn:  'text-amber-700  bg-amber-50',
  error: 'text-red-700    bg-red-50',
};

const deltaIcon: Record<string, string> = {
  ok:    '✓',
  warn:  '⚠',
  error: '✗',
};

export default function PatternCanvas() {
  const measurements  = useAppStore((s) => s.measurements);
  const baseSize      = useAppStore((s) => s.baseSize);
  const styleOptions  = useAppStore((s) => s.styleOptions);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const selectedId    = useAppStore((s) => s.selectedPatternPiece);
  const setSelectedId = useAppStore((s) => s.setSelectedPatternPiece);

  const [tab, setTab]               = useState<TabId>('flat');
  const [showBase, setShowBase]     = useState(true);
  const [showCutLine, setShowCutLine] = useState(true);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  // ── Compute pieces whenever measurements, baseSize, or style change ──
  const pieces: AdjustedPatternPiece[] = useMemo(
    () => computeAdjustedPieces(measurements, baseSize, styleOptions),
    [measurements, baseSize, styleOptions],
  );

  const report = useMemo(
    () => buildAdjustmentReport(measurements, baseSize, styleOptions),
    [measurements, baseSize, styleOptions],
  );

  // Select first piece by default
  useEffect(() => {
    if (pieces.length > 0 && !selectedId) {
      setSelectedId(pieces[0].id);
    }
  }, [pieces, selectedId, setSelectedId]);

  const selectedPiece = pieces.find((p) => p.id === selectedId) ?? null;

  // ── Render ──
  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('mannequin')}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ← Mannequin
          </button>
          <h2 className="text-lg font-semibold text-slate-800">Pattern Pieces</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            Base: {baseSize}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {/* Tab switcher */}
          {(['flat', 'report'] as TabId[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'px-3 py-1.5 rounded border transition-colors font-medium capitalize',
                tab === t
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {t === 'flat' ? 'Flat Pattern' : 'Adjustment Report'}
            </button>
          ))}

          {/* Options (only in flat view) */}
          {tab === 'flat' && (
            <div className="flex items-center gap-2 ml-2 border-l pl-2 border-slate-200">
              <ToggleChip active={showBase} onClick={() => setShowBase((v) => !v)}>
                Base overlay
              </ToggleChip>
              <ToggleChip active={showCutLine} onClick={() => setShowCutLine((v) => !v)}>
                Cut line
              </ToggleChip>
              <ToggleChip active={showKeyPoints} onClick={() => setShowKeyPoints((v) => !v)}>
                Key points
              </ToggleChip>
            </div>
          )}

          <button
            type="button"
            onClick={() => setActiveView('report')}
            className="ml-2 px-3 py-1.5 rounded bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Report →
          </button>
        </div>
      </div>

      {/* ── Legend (flat view only) ─────────────── */}
      {tab === 'flat' && (
        <div className="flex items-center gap-4 text-xs text-slate-500 px-1 flex-wrap">
          <LegendItem color="#1e40af" dash={false} label="Seam line (user fit)" />
          {showBase && <LegendItem color="#94a3b8" dash label="Base size reference" />}
          {showCutLine && <LegendItem color="#64748b" dash label={`Cut line (SA ${pieces[0]?.seamAllowance ?? 1.5} cm)`} />}
          <LegendItem color="#dc2626" dash={false} label="Grain line" />
        </div>
      )}

      {/* ── Main content ────────────────────────── */}
      {tab === 'flat' ? (
        <div className="flex gap-6 items-start">
          {/* Piece grid */}
          <div
            className="flex flex-wrap gap-4 flex-1"
            style={{ minWidth: 0 }}
          >
            {pieces.map((piece) => (
              <PatternPiece
                key={piece.id}
                piece={piece}
                displayWidth={PIECE_W}
                displayHeight={PIECE_H}
                showBaseOverlay={showBase}
                showCutLine={showCutLine}
                showKeyPoints={showKeyPoints}
                isSelected={selectedId === piece.id}
                onClick={() => setSelectedId(piece.id)}
              />
            ))}
          </div>

          {/* Selected piece detail panel */}
          {selectedPiece && (
            <aside className="w-64 shrink-0 flex flex-col gap-3">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-1">{selectedPiece.name}</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Base size: {selectedPiece.baseSize} &nbsp;·&nbsp;
                  Seam allowance: {selectedPiece.seamAllowance} cm
                </p>

                <div className="space-y-1.5">
                  {selectedPiece.adjustments.map((adj) => {
                    const status = classifyDelta(adj.delta);
                    return (
                      <div key={adj.measurementKey} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-600 truncate">{adj.label}</span>
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 rounded ${deltaClass[status]}`}
                        >
                          {adj.delta === 0
                            ? '—'
                            : `${adj.delta > 0 ? '+' : ''}${adj.delta.toFixed(1)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Colour coding guide */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs font-medium text-slate-600 mb-2">Adjustment status</p>
                <div className="space-y-1 text-xs">
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-700 w-3">✓</span>
                    <span className="text-slate-600">≤ 5 cm — normal</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-amber-700 w-3">⚠</span>
                    <span className="text-slate-600">5–10 cm — large</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-red-700 w-3">✗</span>
                    <span className="text-slate-600">&gt; 10 cm — verify fit</span>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* ── Adjustment Report tab ─────────────── */
        <AdjustmentReport report={report} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        active
          ? 'bg-primary-100 border-primary-300 text-primary-700'
          : 'border-slate-200 text-slate-500 hover:bg-slate-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function LegendItem({
  color,
  dash,
  label,
}: {
  color: string;
  dash: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="20" height="8" viewBox="0 0 20 8">
        <line
          x1="0" y1="4" x2="20" y2="4"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dash ? '4,2' : undefined}
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function AdjustmentReport({
  report,
}: {
  report: ReturnType<typeof buildAdjustmentReport>;
}) {
  return (
    <div className="space-y-6">
      {report.pieces.map((p) => (
        <div key={p.pieceId} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">{p.pieceName}</h3>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="text-left px-4 py-2 font-medium">Measurement</th>
                <th className="text-right px-4 py-2 font-medium">Base (L)</th>
                <th className="text-right px-4 py-2 font-medium">Your Size</th>
                <th className="text-center px-4 py-2 font-medium">Adjustment</th>
              </tr>
            </thead>
            <tbody>
              {p.entries.map((e) => {
                const status = classifyDelta(e.delta);
                return (
                  <tr
                    key={e.measurementKey}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-2 text-slate-700">{e.label}</td>
                    <td className="px-4 py-2 text-right text-slate-500 font-mono">
                      {e.baseValue.toFixed(1)} cm
                    </td>
                    <td className="px-4 py-2 text-right text-slate-700 font-mono">
                      {e.userValue.toFixed(1)} cm
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${deltaClass[status]}`}
                      >
                        {deltaIcon[status]}
                        {e.delta === 0
                          ? 'No change'
                          : `${e.delta > 0 ? '+' : ''}${e.delta.toFixed(1)} cm`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
