import { useState } from 'react';
import type { AdjustedPatternPiece } from '../../types/pattern.types';
import { inflatePath, pathBBox } from '../../utils/patternMath';

// ─────────────────────────────────────────────
//  PatternPiece
//  Renders one jacket pattern piece as an SVG panel.
//
//  Visual layers (in z-order, back to front):
//  1. Piece fill (very light tint)
//  2. Cut line  — outer dashed border (seam allowance boundary)
//  3. Base path — grey dashed line (reference size)
//  4. Seam path — solid primary colour (user adjusted)
//  5. Grain line — red arrow (grain direction)
//  6. Fold line  — blue dashed (where applicable)
//  7. Key-point dots
//  8. Piece label
// ─────────────────────────────────────────────

interface PatternPieceProps {
  piece: AdjustedPatternPiece;
  /** Render size in pixels; the piece will be scaled to fit */
  displayWidth?: number;
  displayHeight?: number;
  showBaseOverlay?: boolean;
  showCutLine?: boolean;
  showKeyPoints?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const PADDING   = 8;   // px inside SVG viewBox
const FILL      = '#f0f4ff';
const SEAM_COLOR = '#1e40af';    // primary blue — adjusted seam line
const BASE_COLOR = '#94a3b8';    // slate — base size reference
const GRAIN_COLOR = '#dc2626';   // red — grain line
const CUT_COLOR   = '#64748b';   // grey — cut line

export default function PatternPiece({
  piece,
  displayWidth  = 280,
  displayHeight = 360,
  showBaseOverlay = true,
  showCutLine     = true,
  showKeyPoints   = false,
  isSelected      = false,
  onClick,
}: PatternPieceProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Compute bounding box of the adjusted path
  const bbox = pathBBox(piece.adjustedSvgPath);
  if (bbox.width === 0 || bbox.height === 0) return null;

  const padded = {
    minX: bbox.minX - PADDING,
    minY: bbox.minY - PADDING,
    width: bbox.width + PADDING * 2,
    height: bbox.height + PADDING * 2,
  };

  const viewBox = `${padded.minX} ${padded.minY} ${padded.width} ${padded.height}`;

  // Inflate path for cut line (seam allowance)
  const cutPath = inflatePath(piece.adjustedSvgPath, piece.seamAllowance);

  // Grain line coords
  const { grainLine } = piece;
  const grainDX = grainLine.x2 - grainLine.x1;
  const grainDY = grainLine.y2 - grainLine.y1;
  const grainLen = Math.sqrt(grainDX ** 2 + grainDY ** 2);
  const arrowNorm = grainLen > 0
    ? [grainDX / grainLen, grainDY / grainLen]
    : [0, 1];

  // Arrow head at end of grain line
  const arrowSize = Math.min(padded.width, padded.height) * 0.04;
  const arrowTip: [number, number] = [grainLine.x2, grainLine.y2];
  const arrow = (() => {
    const ax = -arrowNorm[0];
    const ay = -arrowNorm[1];
    const px = -arrowNorm[1] * arrowSize * 0.45;
    const py =  arrowNorm[0] * arrowSize * 0.45;
    return [
      `${arrowTip[0]},${arrowTip[1]}`,
      `${arrowTip[0] + ax * arrowSize + px},${arrowTip[1] + ay * arrowSize + py}`,
      `${arrowTip[0] + ax * arrowSize - px},${arrowTip[1] + ay * arrowSize - py}`,
    ].join(' ');
  })();

  const borderColor = isSelected
    ? 'ring-2 ring-primary-500'
    : 'ring-1 ring-slate-200 hover:ring-primary-300';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm cursor-pointer transition-shadow ${borderColor}`}
      onClick={onClick}
      style={{ width: displayWidth, userSelect: 'none' }}
    >
      {/* ── SVG Canvas ──────────────────────── */}
      <svg
        viewBox={viewBox}
        width={displayWidth}
        height={displayHeight}
        style={{ display: 'block' }}
        aria-label={`Pattern piece: ${piece.name}`}
        onMouseLeave={() => setHovered(null)}
      >
        {/* ❶ Cut line (outer dashed — seam allowance boundary) */}
        {showCutLine && (
          <path
            d={cutPath}
            fill="none"
            stroke={CUT_COLOR}
            strokeWidth={0.4}
            strokeDasharray="1.5,1"
            opacity={0.6}
          />
        )}

        {/* ❷ Piece fill */}
        <path
          d={piece.adjustedSvgPath}
          fill={FILL}
          stroke="none"
        />

        {/* ❸ Base size overlay (grey dashed reference) */}
        {showBaseOverlay && piece.svgPath !== piece.adjustedSvgPath && (
          <path
            d={piece.svgPath}
            fill="none"
            stroke={BASE_COLOR}
            strokeWidth={0.5}
            strokeDasharray="2,1"
            opacity={0.75}
          />
        )}

        {/* ❹ Adjusted seam line (user measurements) */}
        <path
          d={piece.adjustedSvgPath}
          fill="none"
          stroke={SEAM_COLOR}
          strokeWidth={0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ❺ Grain line */}
        <line
          x1={grainLine.x1}
          y1={grainLine.y1}
          x2={grainLine.x2}
          y2={grainLine.y2}
          stroke={GRAIN_COLOR}
          strokeWidth={0.5}
        />
        {/* Grain arrow head */}
        <polygon
          points={arrow}
          fill={GRAIN_COLOR}
        />
        {/* Grain base tick */}
        <line
          x1={grainLine.x1 - 1.5}
          y1={grainLine.y1}
          x2={grainLine.x1 + 1.5}
          y2={grainLine.y1}
          stroke={GRAIN_COLOR}
          strokeWidth={0.5}
        />

        {/* ❻ Key-point dots & labels (on hover / when enabled) */}
        {showKeyPoints && piece.keyPoints.map((kp) => (
          <g
            key={kp.id}
            onMouseEnter={() => setHovered(kp.id)}
            style={{ cursor: 'crosshair' }}
          >
            <circle cx={kp.x} cy={kp.y} r={0.8} fill={SEAM_COLOR} opacity={0.8} />
            {hovered === kp.id && (
              <text
                x={kp.x + 1.2}
                y={kp.y - 0.5}
                fontSize={2.5}
                fill={SEAM_COLOR}
                style={{ pointerEvents: 'none' }}
              >
                {kp.id}
              </text>
            )}
          </g>
        ))}

        {/* ❼ Piece name label */}
        <text
          x={padded.minX + PADDING}
          y={padded.minY + PADDING + 3}
          fontSize={3.5}
          fill="#334155"
          fontWeight="600"
        >
          {piece.name}
        </text>

        {/* Seam allowance note */}
        <text
          x={padded.minX + PADDING}
          y={padded.minY + PADDING + 7.5}
          fontSize={2.2}
          fill={CUT_COLOR}
        >
          SA {piece.seamAllowance} cm (hem 3 cm)
        </text>

        {/* Cut count */}
        <text
          x={padded.minX + PADDING}
          y={padded.minY + PADDING + 11.5}
          fontSize={2.2}
          fill={CUT_COLOR}
        >
          Cut 2 — mirror
        </text>
      </svg>

      {/* ── Piece label strip ────────────────── */}
      <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{piece.name}</span>
        <span className="text-slate-400">
          {piece.adjustments.filter((a) => a.delta !== 0).length > 0
            ? `${piece.adjustments.filter((a) => a.delta !== 0).length} adjustments`
            : 'No changes'}
        </span>
      </div>
    </div>
  );
}
