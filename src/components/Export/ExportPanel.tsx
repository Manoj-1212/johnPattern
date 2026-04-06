// ─────────────────────────────────────────────
//  ExportPanel — Module 6: Export & Print
//  Main view for configuring and triggering pattern exports.
// ─────────────────────────────────────────────

import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { computeAdjustedPieces } from '../PatternEngine/PatternAdjuster';
import { pathBBox } from '../../utils/patternMath';
import {
  DEFAULT_EXPORT_CONFIG,
  PAPER_SIZES_MM,
  SCALE_MM_PER_CM,
  getTileGrid,
  exportAsPdf,
  downloadSvg,
  downloadDxf,
  buildPieceSvgDoc,
} from './PatternTiler';
import type { ExportConfig } from './PatternTiler';
import type { AdjustedPatternPiece } from '../../types/pattern.types';

// ─────────────────────────────────────────────
//  ExportPanel
// ─────────────────────────────────────────────

export default function ExportPanel() {
  const measurements  = useAppStore((s) => s.measurements);
  const baseSize      = useAppStore((s) => s.baseSize);
  const styleOptions  = useAppStore((s) => s.styleOptions);
  const setActiveView = useAppStore((s) => s.setActiveView);

  // Derive all pieces
  const allPieces = useMemo(
    () => computeAdjustedPieces(measurements, baseSize),
    [measurements, baseSize],
  );

  // Export configuration
  const [config, setConfig] = useState<ExportConfig>({
    ...DEFAULT_EXPORT_CONFIG,
    selectedPieceIds: allPieces.map((p) => p.id),
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const setField = useCallback(
    <K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
      setExportStatus(null);
    },
    [],
  );

  const togglePiece = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      selectedPieceIds: prev.selectedPieceIds.includes(id)
        ? prev.selectedPieceIds.filter((x) => x !== id)
        : [...prev.selectedPieceIds, id],
    }));
    setExportStatus(null);
  };

  const selectedPieces = allPieces.filter((p) => config.selectedPieceIds.includes(p.id));

  // ── Export handler ──────────────────────────
  const handleExport = useCallback(async () => {
    if (selectedPieces.length === 0) {
      setExportStatus({ ok: false, msg: 'Select at least one pattern piece.' });
      return;
    }
    setIsExporting(true);
    setExportStatus(null);
    try {
      if (config.format === 'PDF') {
        await exportAsPdf(selectedPieces, config, styleOptions);
        setExportStatus({ ok: true, msg: 'PDF download started.' });
      } else if (config.format === 'SVG') {
        downloadSvg(selectedPieces, config);
        setExportStatus({ ok: true, msg: 'SVG download started.' });
      } else {
        downloadDxf(selectedPieces, config);
        setExportStatus({ ok: true, msg: 'DXF download started.' });
      }
    } catch (e) {
      setExportStatus({ ok: false, msg: `Export failed: ${(e as Error).message}` });
    } finally {
      setIsExporting(false);
    }
  }, [selectedPieces, config, styleOptions]);

  // ── Estimated pages ─────────────────────────
  const estimatedPages = useMemo(() => {
    if (config.format !== 'PDF') return null;
    let pages = 0;
    for (const p of selectedPieces) {
      const bb = pathBBox(p.adjustedSvgPath);
      if (config.scale === '1:1' && config.splitAcrossPages) {
        const { cols, rows } = getTileGrid(bb, config.paperSize);
        pages += cols * rows;
      } else {
        pages += 1;
      }
    }
    if (config.includeStyleSummary) pages += 1;
    return pages;
  }, [selectedPieces, config]);

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* ── Page header ─────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('style')}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ← Style
          </button>
          <h2 className="text-lg font-semibold text-slate-800">Export &amp; Print</h2>
        </div>
      </div>

      {/* ── Main two-column layout ───────────────── */}
      <div className="flex gap-6 items-start">
        {/* ── Left: Config sidebar ──────────────── */}
        <aside className="w-72 shrink-0 space-y-4">
          {/* Format */}
          <ConfigCard title="Export Format">
            <ButtonGroup
              options={[
                { id: 'PDF', label: 'PDF' },
                { id: 'SVG', label: 'SVG' },
                { id: 'DXF', label: 'DXF (CAD)' },
              ]}
              value={config.format}
              onChange={(v) => setField('format', v as ExportConfig['format'])}
            />
            <p className="text-xs text-slate-500 mt-2">
              {config.format === 'PDF' && 'Vector-accurate PDF pages via canvas rendering.'}
              {config.format === 'SVG' && 'Raw SVG file — open in Illustrator, Inkscape, or browser.'}
              {config.format === 'DXF' && 'DXF R12 polylines — compatible with CAD & cutting machines.'}
            </p>
          </ConfigCard>

          {/* Scale */}
          <ConfigCard title="Scale">
            <ButtonGroup
              options={[
                { id: '1:1',  label: '1:1 — True size' },
                { id: '1:5',  label: '1:5 — Reduced' },
                { id: '1:10', label: '1:10 — Overview' },
              ]}
              value={config.scale}
              onChange={(v) => setField('scale', v as ExportConfig['scale'])}
            />
            <p className="text-xs text-slate-500 mt-2">
              {config.scale === '1:1' && 'Print at actual size — for direct cutting on fabric.'}
              {config.scale === '1:5' && 'Fits most pieces on A4 — useful for checking proportions.'}
              {config.scale === '1:10' && 'Compact overview of all pieces on a single page.'}
            </p>
          </ConfigCard>

          {/* Paper size */}
          <ConfigCard title="Paper Size">
            <select
              value={config.paperSize}
              onChange={(e) => setField('paperSize', e.target.value as ExportConfig['paperSize'])}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {Object.entries(PAPER_SIZES_MM).map(([name, [w, h]]) => (
                <option key={name} value={name}>{name} &nbsp;({w}×{h} mm)</option>
              ))}
            </select>
          </ConfigCard>

          {/* Options */}
          <ConfigCard title="Options">
            {([
              ['includeGrainLines',       'Grain lines'],
              ['includeSeamAllowance',    'Cut line (seam allowance)'],
              ['includeNotches',          'Notch / alignment marks'],
              ['includeSewingInstructions', 'Labels & cutting instructions'],
              ['includeStyleSummary',     'Style summary page (PDF only)'],
            ] as [keyof ExportConfig, string][]).map(([key, label]) => (
              <CheckOption
                key={key}
                label={label}
                checked={config[key] as boolean}
                disabled={key === 'includeStyleSummary' && config.format !== 'PDF'}
                onChange={(v) => setField(key, v)}
              />
            ))}

            {config.format === 'PDF' && config.scale === '1:1' && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <CheckOption
                  label="Tile across pages (1:1 print assembly)"
                  checked={config.splitAcrossPages}
                  onChange={(v) => setField('splitAcrossPages', v)}
                />
                {config.splitAcrossPages && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1.5">
                    Prints each piece tiled across multiple pages with registration marks. Assemble by matching crosshairs.
                  </p>
                )}
              </div>
            )}
          </ConfigCard>

          {/* Export summary */}
          <ConfigCard title="Summary">
            <dl className="space-y-1.5 text-xs">
              <SummaryRow label="Format"   value={config.format} />
              <SummaryRow label="Scale"    value={config.scale} />
              <SummaryRow label="Paper"    value={config.paperSize} />
              <SummaryRow label="Pieces"   value={`${selectedPieces.length} of ${allPieces.length}`} />
              {estimatedPages !== null && (
                <SummaryRow label="Est. pages" value={`~${estimatedPages}`} />
              )}
            </dl>
          </ConfigCard>

          {/* Download button */}
          <button
            type="button"
            disabled={isExporting || selectedPieces.length === 0}
            onClick={() => void handleExport()}
            className={[
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors',
              isExporting || selectedPieces.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
            ].join(' ')}
          >
            {isExporting ? (
              <>
                <SpinnerIcon />
                Generating…
              </>
            ) : (
              <>
                <DownloadIcon />
                Download {config.format}
              </>
            )}
          </button>

          {/* Status message */}
          {exportStatus && (
            <p
              className={[
                'text-xs px-3 py-2 rounded-lg border',
                exportStatus.ok
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200',
              ].join(' ')}
            >
              {exportStatus.ok ? '✓ ' : '✗ '}
              {exportStatus.msg}
            </p>
          )}
        </aside>

        {/* ── Right: Piece selector grid ─────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Piece grid header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-700">
              Pattern Pieces
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({selectedPieces.length} selected)
              </span>
            </h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfig((c) => ({ ...c, selectedPieceIds: allPieces.map((p) => p.id) }))}
                className="text-primary-600 hover:underline"
              >
                Select all
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setConfig((c) => ({ ...c, selectedPieceIds: [] }))}
                className="text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Piece cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {allPieces.map((piece) => (
              <PieceThumbnailCard
                key={piece.id}
                piece={piece}
                selected={config.selectedPieceIds.includes(piece.id)}
                onToggle={() => togglePiece(piece.id)}
                config={config}
              />
            ))}
          </div>

          {/* Format-specific notices */}
          {config.format === 'DXF' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <span className="shrink-0 text-blue-500">ℹ</span>
              <p>
                DXF output uses LWPOLYLINE entities (R12 format). Bezier curves are approximated
                as 24-segment polylines. Compatible with AutoCAD, Gerber, and most industrial
                pattern cutters. Open in Inkscape or Illustrator to verify before cutting.
              </p>
            </div>
          )}
          {config.scale === '1:1' && config.format === 'PDF' && !config.splitAcrossPages && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <span className="shrink-0 text-amber-500">⚠</span>
              <p>
                At 1:1 scale, some pieces (front body, back body) are wider than {config.paperSize}.
                Enable <strong>Tile across pages</strong> in options, or switch to A0 paper for a
                single-sheet print.
              </p>
            </div>
          )}
          {config.format === 'SVG' && selectedPieces.length > 1 && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              <span className="shrink-0 text-slate-400">ℹ</span>
              <p>
                Multiple pieces will be combined into a single SVG sheet with all pieces side by side.
                Select a single piece to download it individually.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PieceThumbnailCard
//  Renders a selectable card with an inline SVG preview.
// ─────────────────────────────────────────────

function PieceThumbnailCard({
  piece,
  selected,
  onToggle,
  config,
}: {
  piece: AdjustedPatternPiece;
  selected: boolean;
  onToggle: () => void;
  config: ExportConfig;
}) {
  const bbox = pathBBox(piece.adjustedSvgPath);
  const PAD  = 2;
  const vb   = `${bbox.minX - PAD} ${bbox.minY - PAD} ${bbox.width + PAD * 2} ${bbox.height + PAD * 2}`;

  // Compute estimated size at chosen scale
  const scaleFactor = SCALE_MM_PER_CM[config.scale] ?? 2;
  const [pw, ph] = PAPER_SIZES_MM[config.paperSize] ?? PAPER_SIZES_MM.A4;
  const tileInfo =
    config.scale === '1:1' && config.splitAcrossPages
      ? (() => {
          const { cols, rows } = getTileGrid(bbox, config.paperSize);
          return `${cols * rows} tiles`;
        })()
      : (() => {
          const rawW = bbox.width  * scaleFactor;
          const rawH = bbox.height * scaleFactor;
          return rawW <= pw && rawH <= ph ? 'Fits page' : 'Scaled down';
        })();

  // SVG for the piece outline (simplified thumbnail)
  const cutPath =
    config.includeSeamAllowance
      ? (() => {
          try {
            return buildPieceSvgDoc(piece, config)
              .match(/d="([^"]+)"/)
              ?.[1] ?? '';
          } catch {
            return '';
          }
        })()
      : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={[
        'relative flex flex-col rounded-xl border-2 p-2 cursor-pointer transition-all text-left',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      ].join(' ')}
    >
      {/* Checkmark badge */}
      <span
        className={[
          'absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all',
          selected
            ? 'bg-primary-600 text-white'
            : 'bg-slate-100 text-slate-300',
        ].join(' ')}
      >
        ✓
      </span>

      {/* SVG thumbnail */}
      <div className="w-full aspect-square flex items-center justify-center bg-white rounded-lg border border-slate-100 overflow-hidden mb-2">
        <svg
          viewBox={vb}
          className="w-full h-full p-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          {config.includeSeamAllowance && cutPath && (
            <path
              d={cutPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={bbox.width * 0.004}
              strokeDasharray={`${bbox.width * 0.02},${bbox.width * 0.01}`}
            />
          )}
          <path
            d={piece.adjustedSvgPath}
            fill={selected ? '#eef2ff' : '#f8fafc'}
            stroke={selected ? '#3b82f6' : '#94a3b8'}
            strokeWidth={bbox.width * 0.004}
          />
          {config.includeGrainLines && (
            <line
              x1={piece.grainLine.x1}
              y1={piece.grainLine.y1}
              x2={piece.grainLine.x2}
              y2={piece.grainLine.y2}
              stroke="#dc2626"
              strokeWidth={bbox.width * 0.003}
            />
          )}
        </svg>
      </div>

      {/* Piece name */}
      <p className={`text-xs font-semibold truncate ${selected ? 'text-primary-700' : 'text-slate-700'}`}>
        {piece.name}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{tileInfo}</p>
    </button>
  );
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function ButtonGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors border',
            value === opt.id
              ? 'bg-primary-600 text-white border-primary-600'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckOption({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={[
        'flex items-center gap-2 cursor-pointer select-none text-xs',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
      />
      <span className={disabled ? 'text-slate-400' : 'text-slate-700'}>{label}</span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 font-medium text-right">{value}</dd>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
