// ─────────────────────────────────────────────
//  PatternTiler
//  Export utilities for Module 6 — Export & Print.
//
//  Responsibilities:
//   • ExportConfig interface
//   • Build standalone SVG documents from pattern pieces
//   • Build a combined SVG sheet (all pieces laid out)
//   • Generate DXF (R12, LWPOLYLINE/LINE/TEXT entities)
//   • SVG → PNG via canvas (for embedding in PDF)
//   • PDF generation (jsPDF): single-page + A4 tiling
//   • Download helpers (SVG, DXF, PDF)
//
//  Coordinate convention: pattern coords are in cm (1 unit = 1 cm).
//  Y+ is downward (SVG convention). DXF Y is negated to convert to Y+ upward.
// ─────────────────────────────────────────────

import { jsPDF } from 'jspdf';
import type { AdjustedPatternPiece } from '../../types/pattern.types';
import type { JacketStyleOptions } from '../../types/style.types';
import { parseSvgPathToPoints, pathBBox, inflatePath } from '../../utils/patternMath';

// ─────────────────────────────────────────────
//  ExportConfig
// ─────────────────────────────────────────────

export interface ExportConfig {
  format: 'PDF' | 'SVG' | 'DXF';
  scale: '1:1' | '1:5' | '1:10';
  paperSize: 'A4' | 'A3' | 'A0' | 'Letter';
  includeSewingInstructions: boolean;
  includeGrainLines: boolean;
  includeSeamAllowance: boolean;
  includeNotches: boolean;
  includeStyleSummary: boolean;
  splitAcrossPages: boolean;
  selectedPieceIds: string[];
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'PDF',
  scale: '1:5',
  paperSize: 'A4',
  includeSewingInstructions: true,
  includeGrainLines: true,
  includeSeamAllowance: true,
  includeNotches: true,
  includeStyleSummary: true,
  splitAcrossPages: false,
  selectedPieceIds: [],
};

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

/** Paper sizes in mm [portrait: width, height] */
export const PAPER_SIZES_MM: Record<string, [number, number]> = {
  A4:     [210, 297],
  A3:     [297, 420],
  A0:     [841, 1189],
  Letter: [216, 279],
};

/** mm of paper per cm of pattern at each scale factor */
export const SCALE_MM_PER_CM: Record<string, number> = {
  '1:1':  10,
  '1:5':  2,
  '1:10': 1,
};

/** Cutting instructions keyed by piece ID */
const CUT_INSTRUCTIONS: Record<string, string> = {
  front_body_left:  'Cut 1 + 1 mirrored',
  front_body_right: 'Cut 1',
  back_body:        'Cut 1 on fold',
  sleeve_upper:     'Cut 2',
  sleeve_under:     'Cut 2',
  collar:           'Cut 2 on fold',
};

/** Key-point IDs that receive notch marks */
const NOTCH_IDS = new Set([
  'waistLine', 'hipLine', 'frontHipLine', 'armholeBottom', 'elbow',
]);

// ─────────────────────────────────────────────
//  Internal SVG helpers
// ─────────────────────────────────────────────

function f(n: number): string {
  return n.toFixed(3);
}

/** Render a double-headed grain-line arrow */
function grainLineSvg(piece: AdjustedPatternPiece): string {
  const { x1, y1, x2, y2 } = piece.grainLine;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return '';

  const nx = dx / len;
  const ny = dy / len;
  const px = -ny;
  const py =  nx;
  const as = 1.0; // arrowhead size cm

  // arrowhead at (x2, y2)
  const arrow = (tx: number, ty: number, bx: number, by: number) =>
    `<polygon points="${f(tx)},${f(ty)} ${f(bx - px * as * 0.3)},${f(by - py * as * 0.3)} ${f(bx + px * as * 0.3)},${f(by + py * as * 0.3)}" fill="#dc2626" />`;

  const lx = (x1 + x2) / 2 + px * 0.8;
  const ly = (y1 + y2) / 2 + py * 0.8;

  return [
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#dc2626" stroke-width="0.18" />`,
    arrow(x2, y2, x2 - nx * as, y2 - ny * as),
    arrow(x1, y1, x1 + nx * as, y1 + ny * as),
    `<text x="${f(lx)}" y="${f(ly)}" font-family="sans-serif" font-size="1.1" fill="#dc2626" text-anchor="middle">GRAIN</text>`,
  ].join('\n  ');
}

/** Small rectangular notch marks at selected key-point locations */
function notchesSvg(piece: AdjustedPatternPiece): string {
  const marks = piece.keyPoints
    .filter((kp) => NOTCH_IDS.has(kp.id))
    .map((kp) =>
      `<rect x="${f(kp.x - 0.08)}" y="${f(kp.y - 0.45)}" width="0.16" height="0.9" fill="#0369a1" />`,
    );
  return marks.join('\n  ');
}

/** Piece name, cut instruction, and dimension labels */
function labelsSvg(piece: AdjustedPatternPiece, config: ExportConfig): string {
  if (!config.includeSewingInstructions) return '';

  const bbox = pathBBox(piece.adjustedSvgPath);
  const cx = f(bbox.minX + bbox.width  / 2);
  const cy = bbox.minY + bbox.height / 2;

  const lines: string[] = [
    `<text x="${cx}" y="${f(cy - 2.5)}" font-family="sans-serif" font-size="2.2" font-weight="bold" text-anchor="middle" fill="#0f172a">${piece.name}</text>`,
    `<text x="${cx}" y="${f(cy + 0.2)}" font-family="sans-serif" font-size="1.5" text-anchor="middle" fill="#334155">${CUT_INSTRUCTIONS[piece.id] ?? 'Cut 2'}</text>`,
    `<text x="${cx}" y="${f(cy + 2.2)}" font-family="sans-serif" font-size="1.1" text-anchor="middle" fill="#64748b">SA: ${piece.seamAllowance} cm | Base: ${piece.baseSize} | ${config.scale}</text>`,
  ];
  return lines.join('\n  ');
}

/** Tile registration crosshair marks (drawn at 4 corners of tile rectangle) */
function crosshairsSvg(vb: { minX: number; minY: number; width: number; height: number }): string {
  const { minX, minY, width, height } = vb;
  const corners: [number, number][] = [
    [minX, minY],
    [minX + width, minY],
    [minX, minY + height],
    [minX + width, minY + height],
  ];
  const s = 0.6; // cross arm length cm
  return corners
    .map(
      ([cx, cy]) =>
        `<line x1="${f(cx - s)}" y1="${f(cy)}" x2="${f(cx + s)}" y2="${f(cy)}" stroke="#999" stroke-width="0.1" />\n  ` +
        `<line x1="${f(cx)}" y1="${f(cy - s)}" x2="${f(cx)}" y2="${f(cy + s)}" stroke="#999" stroke-width="0.1" />\n  ` +
        `<circle cx="${f(cx)}" cy="${f(cy)}" r="0.25" fill="none" stroke="#999" stroke-width="0.08" />`,
    )
    .join('\n  ');
}

// ─────────────────────────────────────────────
//  buildPieceSvgDoc
//  Returns a complete standalone SVG for one piece.
//  tileViewBox overrides the full-piece viewBox for tiling.
// ─────────────────────────────────────────────

export function buildPieceSvgDoc(
  piece: AdjustedPatternPiece,
  config: ExportConfig,
  tileViewBox?: { minX: number; minY: number; width: number; height: number },
): string {
  const scaleFactor = SCALE_MM_PER_CM[config.scale] ?? 2;
  const bbox = pathBBox(piece.adjustedSvgPath);
  const PAD = 2.5;

  const vb = tileViewBox ?? {
    minX:   bbox.minX - PAD,
    minY:   bbox.minY - PAD,
    width:  bbox.width  + PAD * 2,
    height: bbox.height + PAD * 2,
  };

  const physW = (vb.width  * scaleFactor).toFixed(2);
  const physH = (vb.height * scaleFactor).toFixed(2);

  const cutPath = config.includeSeamAllowance
    ? inflatePath(piece.adjustedSvgPath, piece.seamAllowance)
    : null;

  const tileLabel = tileViewBox
    ? `<text x="${f(vb.minX + 0.8)}" y="${f(vb.minY + 1.8)}" font-family="sans-serif" font-size="1.4" fill="#64748b">Tile — align crosshairs for assembly</text>`
    : '';

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `  width="${physW}mm" height="${physH}mm"`,
    `  viewBox="${f(vb.minX)} ${f(vb.minY)} ${f(vb.width)} ${f(vb.height)}">`,
    `  <title>${piece.name}</title>`,
    `  <!-- ${piece.name} | Base ${piece.baseSize} | ${config.scale} | SA ${piece.seamAllowance} cm -->`,
    `  <rect x="${f(vb.minX)}" y="${f(vb.minY)}" width="${f(vb.width)}" height="${f(vb.height)}" fill="white" />`,
    cutPath
      ? `  <path d="${cutPath}" fill="none" stroke="#64748b" stroke-width="0.15" stroke-dasharray="0.6,0.3" />`
      : '',
    `  <path d="${piece.adjustedSvgPath}" fill="#eef2ff" fill-opacity="0.45" stroke="#1e40af" stroke-width="0.22" stroke-linejoin="round" stroke-linecap="round" />`,
    config.includeGrainLines ? `  ${grainLineSvg(piece)}` : '',
    config.includeNotches ? `  ${notchesSvg(piece)}` : '',
    `  ${labelsSvg(piece, config)}`,
    tileViewBox ? `  ${crosshairsSvg(vb)}` : '',
    tileLabel,
    `</svg>`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─────────────────────────────────────────────
//  buildAllPiecesSvgSheet
//  All pieces side-by-side on one large SVG.
// ─────────────────────────────────────────────

export function buildAllPiecesSvgSheet(
  pieces: AdjustedPatternPiece[],
  config: ExportConfig,
): string {
  const scaleFactor = SCALE_MM_PER_CM[config.scale] ?? 2;
  const GAP = 4;  // cm gap between pieces
  const PAD = 3;  // outer padding

  let cursorX = PAD;
  const placements: {
    piece: AdjustedPatternPiece;
    tx: number;
    ty: number;
    bbox: ReturnType<typeof pathBBox>;
  }[] = [];
  let totalH = 0;

  for (const piece of pieces) {
    const bb = pathBBox(piece.adjustedSvgPath);
    placements.push({ piece, tx: cursorX - bb.minX, ty: PAD - bb.minY, bbox: bb });
    cursorX += bb.width + GAP;
    if (bb.height > totalH) totalH = bb.height;
  }

  const totalW = cursorX;
  const totalHwPad = totalH + PAD * 2;

  const physW = (totalW      * scaleFactor).toFixed(2);
  const physH = (totalHwPad  * scaleFactor).toFixed(2);

  const pieceElems = placements
    .map(({ piece, tx, ty }) => {
      const cutPath = config.includeSeamAllowance
        ? inflatePath(piece.adjustedSvgPath, piece.seamAllowance)
        : null;
      return [
        `  <g transform="translate(${f(tx)},${f(ty)})">`,
        cutPath
          ? `    <path d="${cutPath}" fill="none" stroke="#64748b" stroke-width="0.15" stroke-dasharray="0.6,0.3" />`
          : '',
        `    <path d="${piece.adjustedSvgPath}" fill="#eef2ff" fill-opacity="0.45" stroke="#1e40af" stroke-width="0.22" stroke-linejoin="round" />`,
        config.includeGrainLines ? `    ${grainLineSvg(piece)}` : '',
        config.includeNotches ? `    ${notchesSvg(piece)}` : '',
        `    ${labelsSvg(piece, config)}`,
        `  </g>`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `  width="${physW}mm" height="${physH}mm"`,
    `  viewBox="0 0 ${f(totalW)} ${f(totalHwPad)}">`,
    `  <title>Jacket Pattern — All Pieces</title>`,
    `  <rect width="${f(totalW)}" height="${f(totalHwPad)}" fill="white" />`,
    pieceElems,
    `</svg>`,
  ].join('\n');
}

// ─────────────────────────────────────────────
//  buildDxfString
//  True DXF R12 (AC1009) — universally supported by every CAD viewer,
//  cutting-machine software, LibreCAD, QCAD, AutoCAD, Inkscape, etc.
//
//  R12 requires ONLY: HEADER + ENTITIES + EOF.
//  No TABLES, no BLOCKS, no OBJECTS sections needed.
//  Uses POLYLINE / VERTEX / SEQEND (the R12 native polyline entity).
//  LWPOLYLINE is NOT used — it is an R2000 entity and causes blank screens
//  or crashes in viewers that don't fully implement the newer format.
//  $EXTMIN / $EXTMAX are set from actual geometry so viewers zoom to fit.
//  DXF Y+ is upward; SVG Y+ is downward — Y is negated on export.
// ─────────────────────────────────────────────

export function buildDxfString(
  pieces: AdjustedPatternPiece[],
  config: ExportConfig,
): string {
  if (pieces.length === 0) return '';

  const dy = (y: number) => -y; // SVG Y+ down → DXF Y+ up

  const entities: string[] = [];

  // Track global extents for $EXTMIN/$EXTMAX
  let minX =  Infinity, minY =  Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  const expandExtents = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const piece of pieces) {
    // Layer name: only ASCII alphanumeric / underscore / hyphen, max 31 chars
    const layer = piece.id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 31);

    // ── Seam polyline ──────────────────────────
    const seamPts = parseSvgPathToPoints(piece.adjustedSvgPath, 24);
    if (seamPts.length >= 2) {
      const dxfPts: [number, number][] = seamPts.map(([x, y]) => {
        const yd = dy(y);
        expandExtents(x, yd);
        return [x, yd];
      });
      entities.push(dxfPolyline(dxfPts, layer, true));
    }

    // ── Cut line polyline ──────────────────────
    if (config.includeSeamAllowance) {
      const cutLayer = (layer + '_CUT').slice(0, 31);
      const cutPts   = parseSvgPathToPoints(
        inflatePath(piece.adjustedSvgPath, piece.seamAllowance), 24,
      );
      if (cutPts.length >= 2) {
        const dxfCutPts: [number, number][] = cutPts.map(([x, y]) => {
          const yd = dy(y);
          expandExtents(x, yd);
          return [x, yd];
        });
        entities.push(dxfPolyline(dxfCutPts, cutLayer, true));
      }
    }

    // ── Grain line ─────────────────────────────
    if (config.includeGrainLines) {
      const { x1, y1, x2, y2 } = piece.grainLine;
      const gy1 = dy(y1), gy2 = dy(y2);
      expandExtents(x1, gy1);
      expandExtents(x2, gy2);
      entities.push(dxfLine(x1, gy1, x2, gy2, layer));
    }

    // ── Text labels ────────────────────────────
    if (config.includeSewingInstructions) {
      const bb  = pathBBox(piece.adjustedSvgPath);
      const cx  = bb.minX + bb.width  / 2;
      const cyd = dy(bb.minY + bb.height / 2);
      entities.push(dxfText(piece.name,                              cx, cyd + 3.0,  2.2, layer));
      entities.push(dxfText(CUT_INSTRUCTIONS[piece.id] ?? 'Cut 2',   cx, cyd + 0.5,  1.5, layer));
      entities.push(dxfText(`SA ${piece.seamAllowance}cm  Base ${piece.baseSize}`, cx, cyd - 1.5, 1.2, layer));
    }
  }

  // Fallback extents if geometry was empty
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100; }

  // Pad extents 5% so pieces aren't flush against the viewport edge
  const padX = (maxX - minX) * 0.05;
  const padY = (maxY - minY) * 0.05;
  minX -= padX; minY -= padY;
  maxX += padX; maxY += padY;

  // ── Assemble file ──────────────────────────
  const lines: string[] = [
    '  0', 'SECTION',
    '  2', 'HEADER',
    '  9', '$ACADVER',
    '  1', 'AC1009',
    '  9', '$INSUNITS',
    ' 70', '5',
    '  9', '$EXTMIN',
    ' 10', minX.toFixed(4),
    ' 20', minY.toFixed(4),
    '  9', '$EXTMAX',
    ' 10', maxX.toFixed(4),
    ' 20', maxY.toFixed(4),
    '  9', '$LIMMIN',
    ' 10', minX.toFixed(4),
    ' 20', minY.toFixed(4),
    '  9', '$LIMMAX',
    ' 10', maxX.toFixed(4),
    ' 20', maxY.toFixed(4),
    '  0', 'ENDSEC',
    '  0', 'SECTION',
    '  2', 'ENTITIES',
  ];

  const body = lines.join('\n') + '\n' + entities.join('\n') + '\n  0\nENDSEC\n  0\nEOF';
  return body;
}

// ── DXF R12 entity helpers ────────────────────
// Group codes are right-justified in a 3-char field as per spec.

/** POLYLINE / VERTEX / SEQEND — R12 closed polygon */
function dxfPolyline(pts: [number, number][], layer: string, closed: boolean): string {
  const flag = closed ? '1' : '0';
  const parts: string[] = [
    '  0', 'POLYLINE',
    '  8', layer,
    ' 66', '     1',
    ' 70', flag,
  ];
  for (const [x, y] of pts) {
    parts.push(
      '  0', 'VERTEX',
      '  8', layer,
      ' 10', x.toFixed(4),
      ' 20', y.toFixed(4),
    );
  }
  parts.push('  0', 'SEQEND', '  8', layer);
  return parts.join('\n');
}

/** LINE entity */
function dxfLine(x1: number, y1: number, x2: number, y2: number, layer: string): string {
  return [
    '  0', 'LINE',
    '  8', layer,
    ' 10', x1.toFixed(4),
    ' 20', y1.toFixed(4),
    ' 11', x2.toFixed(4),
    ' 21', y2.toFixed(4),
  ].join('\n');
}

/** TEXT entity */
function dxfText(text: string, x: number, y: number, height: number, layer: string): string {
  // Sanitise: keep only printable ASCII (DXF R12 TEXT is not Unicode-capable)
  const safe = text.replace(/[^\x20-\x7E]/g, '?');
  return [
    '  0', 'TEXT',
    '  8', layer,
    ' 10', x.toFixed(4),
    ' 20', y.toFixed(4),
    ' 40', height.toFixed(4),
    '  1', safe,
    ' 72', '1',
  ].join('\n');
}

// ─────────────────────────────────────────────
//  SVG → PNG via Canvas
//  Used internally by exportAsPdf to convert SVG to a
//  PNG data URL that jsPDF can embed.
// ─────────────────────────────────────────────

async function svgToDataUrl(
  svgString: string,
  widthPx: number,
  heightPx: number,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = Math.max(1, widthPx);
        canvas.height = Math.max(1, heightPx);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas 2D context');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png', 0.92));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };

    img.src = url;
  });
}

// ─────────────────────────────────────────────
//  getTileGrid — how many tiles for 1:1 printing
// ─────────────────────────────────────────────

export function getTileGrid(
  pieceBboxCm: { width: number; height: number },
  paperSize: string,
  marginMm = 10,
): { cols: number; rows: number; tileWcm: number; tileHcm: number } {
  const [w, h] = PAPER_SIZES_MM[paperSize] ?? PAPER_SIZES_MM.A4;
  const usableW = (w - marginMm * 2) / 10; // mm → cm (at 1:1, 1cm = 10mm)
  const usableH = (h - marginMm * 2) / 10;
  return {
    cols:    Math.ceil(pieceBboxCm.width  / usableW),
    rows:    Math.ceil(pieceBboxCm.height / usableH),
    tileWcm: usableW,
    tileHcm: usableH,
  };
}

// ─────────────────────────────────────────────
//  PDF page utilities
// ─────────────────────────────────────────────

type JsPdfFormat = 'a4' | 'a3' | 'a0' | 'letter';

function pdfFormat(ps: string): JsPdfFormat {
  return ps.toLowerCase() as JsPdfFormat;
}

function addPageHeader(
  doc: jsPDF,
  title: string,
  scale: string,
  paperSize: string,
  marginMm: number,
  paperW: number,
): void {
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(title, marginMm, marginMm - 2.5);
  doc.text(
    `Scale ${scale}  ·  ${paperSize}  ·  TailorCraft`,
    paperW - marginMm,
    marginMm - 2.5,
    { align: 'right' },
  );
  // thin border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.25);
  doc.rect(marginMm / 2, marginMm / 2, paperW - marginMm, 0); // top rule only
}

function addPageFooter(
  doc: jsPDF,
  text: string,
  marginMm: number,
  paperW: number,
  paperH: number,
): void {
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(text, paperW / 2, paperH - marginMm / 2, { align: 'center' });
}

function drawPdfCrosshairs(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const arm = 3.5; // mm
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  for (const [cx, cy] of [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h],
  ] as [number, number][]) {
    doc.line(cx - arm, cy, cx + arm, cy);
    doc.line(cx, cy - arm, cx, cy + arm);
    doc.circle(cx, cy, 1.2);
  }
}

// ─────────────────────────────────────────────
//  exportAsPdf — main async PDF export function
// ─────────────────────────────────────────────

export async function exportAsPdf(
  pieces: AdjustedPatternPiece[],
  config: ExportConfig,
  styleOptions?: JacketStyleOptions,
): Promise<void> {
  const [paperW, paperH] = PAPER_SIZES_MM[config.paperSize] ?? PAPER_SIZES_MM.A4;
  const margin    = 12;   // mm
  const usableW   = paperW - margin * 2;
  const usableH   = paperH - margin * 2;
  const scaleFactor = SCALE_MM_PER_CM[config.scale] ?? 2;
  const DPI       = 144;  // render resolution for canvas
  const fmt       = pdfFormat(config.paperSize);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: fmt });
  let firstPage = true;

  const nextPage = (title: string) => {
    if (!firstPage) doc.addPage(fmt, 'portrait');
    firstPage = false;
    addPageHeader(doc, title, config.scale, config.paperSize, margin, paperW);
  };

  // ── Render each piece ────────────────────────
  for (const piece of pieces) {
    const bbox = pathBBox(piece.adjustedSvgPath);

    if (config.scale === '1:1' && config.splitAcrossPages) {
      // ── Tiled 1:1 output ───────────────────────
      const tileWcm = usableW / 10;
      const tileHcm = usableH / 10;
      const cols = Math.ceil(bbox.width  / tileWcm);
      const rows = Math.ceil(bbox.height / tileHcm);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const label = `${String.fromCharCode(65 + row)}${col + 1}`;
          nextPage(`${piece.name}  —  Tile ${label} of ${rows}×${cols}`);

          const tileVB = {
            minX:   bbox.minX + col * tileWcm,
            minY:   bbox.minY + row * tileHcm,
            width:  tileWcm,
            height: tileHcm,
          };

          const svgStr = buildPieceSvgDoc(piece, config, tileVB);
          const pxW = Math.round(tileWcm * (DPI / 2.54));
          const pxH = Math.round(tileHcm * (DPI / 2.54));

          try {
            const dataUrl = await svgToDataUrl(svgStr, pxW, pxH);
            doc.addImage(dataUrl, 'PNG', margin, margin, usableW, usableH);
          } catch {
            doc.setFontSize(9);
            doc.setTextColor(220, 38, 38);
            doc.text(`[Render error — ${piece.name} tile ${label}]`, margin, margin + 20);
          }

          drawPdfCrosshairs(doc, margin, margin, usableW, usableH);
          addPageFooter(
            doc,
            `${piece.name}  ·  ${CUT_INSTRUCTIONS[piece.id] ?? 'Cut 2'}  ·  SA: ${piece.seamAllowance} cm  ·  Match tile ${label}`,
            margin, paperW, paperH,
          );
        }
      }
    } else {
      // ── Standard single-page piece ─────────────
      nextPage(piece.name);

      // Scale piece to fit usable area (preserving aspect ratio)
      const rawW = bbox.width  * scaleFactor;
      const rawH = bbox.height * scaleFactor;
      const fitScale = Math.min(1, usableW / rawW, usableH / rawH);
      const drawW = rawW * fitScale;
      const drawH = rawH * fitScale;

      // Center on page
      const x = margin + (usableW - drawW) / 2;
      const y = margin + (usableH - drawH) / 2;

      const svgStr = buildPieceSvgDoc(piece, config);
      const pxW = Math.round(drawW * (DPI / 25.4)); // mm → inch → px
      const pxH = Math.round(drawH * (DPI / 25.4));

      try {
        const dataUrl = await svgToDataUrl(svgStr, pxW, pxH);
        doc.addImage(dataUrl, 'PNG', x, y, drawW, drawH);
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        doc.text(`[Render error — ${piece.name}]`, margin, margin + 20);
      }

      addPageFooter(
        doc,
        `${piece.name}  ·  ${CUT_INSTRUCTIONS[piece.id] ?? 'Cut 2'}  ·  SA: ${piece.seamAllowance} cm  ·  Base: ${piece.baseSize}`,
        margin, paperW, paperH,
      );
    }
  }

  // ── Style summary page ─────────────────────
  if (config.includeStyleSummary && styleOptions) {
    doc.addPage(fmt, 'portrait');
    addPageHeader(doc, 'Style Summary', config.scale, config.paperSize, margin, paperW);
    renderStyleSummaryPage(doc, styleOptions, margin, paperW, paperH);
  }

  doc.save('jacket-pattern.pdf');
}

// ─────────────────────────────────────────────
//  Style summary page renderer
// ─────────────────────────────────────────────

function fmt(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderStyleSummaryPage(
  doc: jsPDF,
  opts: JacketStyleOptions,
  margin: number,
  pageW: number,
  pageH: number,
): void {
  let y = margin + 8;

  // Title
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Style Summary', margin, y);
  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  const rows: [string, string][] = [
    ['Collar Type',   fmt(opts.collarType)],
    ['Lapel Style',   fmt(opts.lapelStyle)],
    ['Lapel Width',   fmt(opts.lapelWidth)],
    ['Button Style',  fmt(opts.buttonConfig.style)],
    ['Button Count',  String(opts.buttonConfig.buttonCount)],
    ['Button Size',   `${opts.buttonConfig.buttonSize} mm`],
    ['Buttonhole',    fmt(opts.buttonConfig.buttonholeType)],
    ['Chest Pocket',  fmt(opts.pocketConfig.chestPocket)],
    ['Side Pockets',  fmt(opts.pocketConfig.sidePockets)],
    ['Ticket Pocket', opts.pocketConfig.includeTicketPocket ? 'Yes' : 'No'],
    ['Pocket Width',  `${opts.pocketConfig.pocketWidth} cm`],
    ['Sleeve Style',  fmt(opts.sleeveStyle)],
    ['Cuff Style',    fmt(opts.cuffConfig.style)],
    ['Cuff Buttons',  String(opts.cuffConfig.buttonCount)],
    ['Back Vent',     fmt(opts.backVent)],
    ['Back Seam',     fmt(opts.backSeam)],
    ['Lining',        opts.liningConfig.noLining ? 'None' : opts.liningConfig.halfLined ? 'Half lined' : 'Fully lined'],
    ['Lining Colour', opts.liningConfig.liningColor],
  ];

  const rowH   = 7.5;
  const col2   = margin + 55;

  doc.setFontSize(9);
  rows.forEach(([label, value], i) => {
    if (y + rowH > pageH - margin) return; // guard overflow

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4.5, pageW - margin * 2, rowH, 'F');
    }

    doc.setTextColor(100, 116, 139);
    doc.text(label, margin + 2, y);
    doc.setTextColor(15, 23, 42);
    doc.text(value, col2, y);

    // Lining colour swatch
    if (label === 'Lining Colour' && !opts.liningConfig.noLining) {
      const hex = opts.liningConfig.liningColor.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(col2 + 32, y - 4, 6, 5, 0.8, 0.8, 'FD');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7.5);
        doc.text(opts.liningConfig.liningColor, col2 + 40, y);
        doc.setFontSize(9);
      }
    }

    y += rowH;
  });
}

// ─────────────────────────────────────────────
//  Download helpers
// ─────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSvg(pieces: AdjustedPatternPiece[], config: ExportConfig): void {
  if (pieces.length === 0) return;

  const svgStr = pieces.length === 1
    ? buildPieceSvgDoc(pieces[0], config)
    : buildAllPiecesSvgSheet(pieces, config);

  const filename = pieces.length === 1
    ? `${pieces[0].id}.svg`
    : 'jacket-pattern-all.svg';

  triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), filename);
}

export function downloadDxf(pieces: AdjustedPatternPiece[], config: ExportConfig): void {
  const dxf = buildDxfString(pieces, config);
  triggerDownload(new Blob([dxf], { type: 'application/octet-stream' }), 'jacket-pattern.dxf');
}
