// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  PatternOverlay3D
//
//  Renders each jacket pattern piece as a semi-transparent
//  textured plane positioned around the 3D mannequin so the
//  user can see how the pieces assemble on the body.
//
//  Key design decisions
//  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  â€¢ Front / back panels  â†’ flat planes flush against the torso
//    front (+Z) and back (âˆ’Z), facing the viewer.
//  â€¢ Sleeves              â†’ face the viewer (rotation.y = 0), centered
//    on the arm axis (x = Â±shoulderHalfSpan), z just in front of the
//    arm cylinder.  This makes them visible as full sleeve shapes from
//    the front and they naturally overlap the armhole area.
//  â€¢ Collar               â†’ vertical plane at the front of the neck.
//  â€¢ Canvas texture       â†’ pattern fill + subtle diagonal fabric grain
//    (clipped) + seam-allowance dashes + bold seam line + grain-line
//    arrow drawn from piece.grainLine data.
//
//  Coordinate system
//  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  Mannequin: Y=0 at hips base, +Y = up, all cm.
//  Pattern  : Y=0 at HPS (shoulder), +Y = down.
//  Mapping  : mannequinY = shoulderY âˆ’ patternY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useMemo } from 'react';
import * as THREE from 'three';
import type { AdjustedPatternPiece } from '../../types/pattern.types';
import type { MannequinDimensions } from '../../utils/morphWeightMapper';
import { pathBBox } from '../../utils/patternMath';

// â”€â”€ Per-piece colours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FILL: Record<string, string> = {
  jacket_front:        'rgba(186, 230, 253, 0.82)',  // sky-200
  jacket_back:         'rgba(187, 247, 208, 0.82)',  // green-200
  jacket_sleeve_upper: 'rgba(254, 215, 170, 0.88)',  // orange-200
  jacket_sleeve_under: 'rgba(253, 186, 116, 0.80)',  // orange-300
  jacket_collar:       'rgba(233, 213, 255, 0.88)',  // purple-200
};

const STROKE_HEX: Record<string, string> = {
  jacket_front:        '#0369a1',
  jacket_back:         '#166534',
  jacket_sleeve_upper: '#92400e',
  jacket_sleeve_under: '#9a3412',
  jacket_collar:       '#5b21b6',
};

export const PIECE_LABELS: Record<string, string> = {
  jacket_front:        'Front Panel',
  jacket_back:         'Back Panel',
  jacket_sleeve_upper: 'Sleeve Upper',
  jacket_sleeve_under: 'Sleeve Under',
  jacket_collar:       'Collar',
};

export const PIECE_FILL_DISPLAY: Record<string, string> = {
  jacket_front:        '#93c5fd',
  jacket_back:         '#86efac',
  jacket_sleeve_upper: '#fdba74',
  jacket_sleeve_under: '#fb923c',
  jacket_collar:       '#c4b5fd',
};

// â”€â”€ Canvas texture builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TEX_SIZE = 896; // 896 px square for good crispness
const PAD = 16;       // pixel padding inside canvas border

/** Hex colour string â†’ r,g,b components for rgba() construction */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function buildCanvasTexture(
  piece: AdjustedPatternPiece,
  fill: string,
  strokeHex: string,
): THREE.CanvasTexture {
  const svgPath = piece.adjustedSvgPath;
  const bb = pathBBox(svgPath);
  if (bb.width === 0 || bb.height === 0) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return new THREE.CanvasTexture(c);
  }

  const avail = TEX_SIZE - PAD * 2;
  const sc    = Math.min(avail / bb.width, avail / bb.height);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
  ctx.save();
  ctx.translate(PAD - bb.minX * sc, PAD - bb.minY * sc);
  ctx.scale(sc, sc);

  const p2d = new Path2D(svgPath);
  const rgb = hexToRgb(strokeHex);

  // â”€â”€ 1. Base fill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ctx.fillStyle = fill;
  ctx.fill(p2d);

  // â”€â”€ 2. Fabric grain texture â€” fine diagonal lines (clipped)
  ctx.save();
  ctx.clip(p2d);
  ctx.strokeStyle = `rgba(${rgb}, 0.10)`;
  ctx.lineWidth   = 0.5 / sc;
  const step  = 4 / sc;
  const sweep = (bb.width + bb.height) * 2;
  for (let d = -sweep; d < sweep; d += step) {
    ctx.beginPath();
    ctx.moveTo(bb.minX + d,               bb.minY);
    ctx.lineTo(bb.minX + d + bb.height,   bb.minY + bb.height);
    ctx.stroke();
  }
  // Subtle cross-grain (perpendicular, lighter)
  ctx.strokeStyle = `rgba(${rgb}, 0.05)`;
  ctx.lineWidth   = 0.4 / sc;
  for (let d = -sweep; d < sweep; d += step * 1.6) {
    ctx.beginPath();
    ctx.moveTo(bb.minX,           bb.minY + d);
    ctx.lineTo(bb.minX + bb.width, bb.minY + d + bb.width);
    ctx.stroke();
  }
  ctx.restore(); // un-clip

  // â”€â”€ 3. Seam allowance â€” inner dashed line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ctx.strokeStyle = `rgba(${rgb}, 0.50)`;
  ctx.setLineDash([5 / sc, 3 / sc]);
  ctx.lineWidth   = 1.6 / sc;
  ctx.stroke(p2d);
  ctx.setLineDash([]);

  // â”€â”€ 4. Seam line â€” bold outer contour â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ctx.strokeStyle = strokeHex;
  ctx.lineWidth   = 3.2 / sc;
  ctx.lineJoin    = 'round';
  ctx.stroke(p2d);

  // â”€â”€ 5. Grain line with double-headed arrow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const gl   = piece.grainLine;
  const glDx = gl.x2 - gl.x1;
  const glDy = gl.y2 - gl.y1;
  const glLen = Math.sqrt(glDx * glDx + glDy * glDy);
  if (glLen > 1) {
    const ux = glDx / glLen;
    const uy = glDy / glLen;
    const aw = Math.min(glLen * 0.12, 3 / sc); // arrow half-width
    const ah = Math.min(glLen * 0.18, 5 / sc); // arrow head length

    ctx.strokeStyle = strokeHex;
    ctx.fillStyle   = strokeHex;
    ctx.lineWidth   = 2 / sc;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(gl.x1, gl.y1);
    ctx.lineTo(gl.x2, gl.y2);
    ctx.stroke();

    // Arrow head at bottom (gl.x2, gl.y2)
    ctx.beginPath();
    ctx.moveTo(gl.x2, gl.y2);
    ctx.lineTo(gl.x2 - ux * ah + uy * aw, gl.y2 - uy * ah - ux * aw);
    ctx.lineTo(gl.x2 - ux * ah - uy * aw, gl.y2 - uy * ah + ux * aw);
    ctx.closePath();
    ctx.fill();

    // Arrow head at top (gl.x1, gl.y1) â€” reverse direction
    ctx.beginPath();
    ctx.moveTo(gl.x1, gl.y1);
    ctx.lineTo(gl.x1 + ux * ah + uy * aw, gl.y1 + uy * ah - ux * aw);
    ctx.lineTo(gl.x1 + ux * ah - uy * aw, gl.y1 + uy * ah + ux * aw);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  pieces: AdjustedPatternPiece[];
  dims: MannequinDimensions;
  /** 0â€“1 overall opacity. Default 0.85 */
  opacity?: number;
}

export default function PatternOverlay3D({ pieces, dims, opacity = 0.85 }: Props) {
  // â”€â”€ Mannequin Y landmarks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const chestTop  = dims.hipsHeight + dims.waistHeight + dims.chestHeight;
  const shoulderY = chestTop - 4;                         // shoulder joint
  const neckMidY  = chestTop + dims.neckHeight * 0.5;

  // Front torso Z after group.scale depthFactor
  const depthFactor = dims.hipsRadiusX / dims.hipsRadiusZ;
  const frontZ      = dims.chestRadiusZ * depthFactor;

  const GAP = 1.0; // cm clearance between mannequin surface and panel

  // â”€â”€ Build / memoize textures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const textures = useMemo<Record<string, THREE.CanvasTexture>>(() => {
    const out: Record<string, THREE.CanvasTexture> = {};
    for (const p of pieces) {
      out[p.id] = buildCanvasTexture(
        p,
        FILL[p.id]       ?? 'rgba(200, 220, 255, 0.80)',
        STROKE_HEX[p.id] ?? '#3b82f6',
      );
    }
    return out;
  }, [pieces]);

  // â”€â”€ Per-piece render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const nodes: React.ReactNode[] = [];

  for (const piece of pieces) {
    const tex = textures[piece.id];
    if (!tex) continue;

    const bb = pathBBox(piece.adjustedSvgPath);
    if (bb.width < 0.5 || bb.height < 0.5) continue;

    // Pattern Y=0 == HPS == shoulderY in mannequin space.
    // Centre of plane (mannequin Y): top = shoulderY âˆ’ bb.minY â†’ centre at top âˆ’ half_height
    const cy = shoulderY - bb.minY - bb.height / 2;

    // Shared material props (written inline per mesh â€” R3F re-uses the texture ref)
    const matProps = {
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      alphaTest: 0.015,
    } as const;

    // â”€â”€ FRONT PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Two mirrored halves (CF at x=0, side seam outward), flush against chest front.
    if (piece.id === 'jacket_front') {
      const pz = frontZ + GAP;
      nodes.push(
        <group key="front" position={[0, cy, pz]}>
          {/* Right half â€” CF=0 â†’ right side seam */}
          <mesh position={[bb.width / 2, 0, 0]}>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
          {/* Left half â€” mirrored */}
          <mesh position={[-bb.width / 2, 0, 0]} scale={[-1, 1, 1]}>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
        </group>,
      );
    }

    // â”€â”€ BACK PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    else if (piece.id === 'jacket_back') {
      const pz = -(frontZ + GAP);
      nodes.push(
        <group key="back" position={[0, cy, pz]} rotation={[0, Math.PI, 0]}>
          <mesh position={[bb.width / 2, 0, 0]}>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
          <mesh position={[-bb.width / 2, 0, 0]} scale={[-1, 1, 1]}>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
        </group>,
      );
    }

    // â”€â”€ SLEEVE UPPER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Face the viewer (rotation.y = 0 = default).
    // Centred on the arm axis (x = Â±shoulderHalfSpan).
    // Positioned just in front of the arm cylinder so the full
    // sleeve shape is visible from the front and it naturally
    // overlaps the armhole area of the body panel.
    else if (piece.id === 'jacket_sleeve_upper') {
      // z: slightly in front of the arm's front face
      const armFrontZ = dims.upperArmRadius + 0.8;
      const ax = dims.shoulderHalfSpan; // arm axis X

      nodes.push(
        <group key="sleeve-upper-r" position={[ax, cy, armFrontZ]}>
          <mesh>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
        </group>,
      );
      // Left arm â€” mirror in X
      nodes.push(
        <group key="sleeve-upper-l" position={[-ax, cy, armFrontZ]}>
          <mesh scale={[-1, 1, 1]}>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
        </group>,
      );
    }

    // â”€â”€ SLEEVE UNDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Same orientation, slightly behind sleeve upper (inside the arm).
    else if (piece.id === 'jacket_sleeve_under') {
      const armFrontZ = dims.upperArmRadius - 0.8;
      const ax = dims.shoulderHalfSpan;

      nodes.push(
        <group key="sleeve-under-r" position={[ax, cy, armFrontZ]}>
          <mesh>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} opacity={opacity * 0.88} />
          </mesh>
        </group>,
      );
      nodes.push(
        <group key="sleeve-under-l" position={[-ax, cy, armFrontZ]}>
          <mesh scale={[-1, 1, 1]}>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} opacity={opacity * 0.88} />
          </mesh>
        </group>,
      );
    }

    // â”€â”€ COLLAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Vertical plane at the front of the neck, facing the viewer.
    // The collar piece is centred horizontally and sits at neck level.
    else if (piece.id === 'jacket_collar') {
      const collarZ  = dims.neckRadius + GAP;
      // Place collar so its vertical centre is at mid-neck height;
      // horizontally centred at x=0 (collar width straddles CF).
      const collarCy = neckMidY - bb.height * 0.2; // slightly above neck mid
      nodes.push(
        <group key="collar" position={[0, collarCy, collarZ]}>
          <mesh>
            <planeGeometry args={[bb.width, bb.height]} />
            <meshBasicMaterial map={tex} {...matProps} />
          </mesh>
        </group>,
      );
    }
  }

  // renderOrder={2} ensures panels draw on top of the opaque mannequin
  return <group renderOrder={2}>{nodes}</group>;
}

export { FILL, STROKE_HEX };

