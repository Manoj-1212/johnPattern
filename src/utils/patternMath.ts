// ─────────────────────────────────────────────
//  Pattern Math Utilities
//  Vector helpers, bezier sampling, SVG path tools
// ─────────────────────────────────────────────

export type Vec2 = [number, number];

// ── Vector primitives ────────────────────────

export function fmtPt([x, y]: Vec2, decimals = 2): string {
  return `${+x.toFixed(decimals)},${+y.toFixed(decimals)}`;
}

export function add2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scale2([x, y]: Vec2, s: number): Vec2 {
  return [x * s, y * s];
}

export function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function len2([x, y]: Vec2): number {
  return Math.sqrt(x * x + y * y);
}

export function norm2(v: Vec2): Vec2 {
  const l = len2(v);
  return l < 1e-9 ? [0, 0] : [v[0] / l, v[1] / l];
}

/** 90° CCW perpendicular */
export function perp2([x, y]: Vec2): Vec2 {
  return [-y, x];
}

export function centroid(pts: Vec2[]): Vec2 {
  const sum = pts.reduce<Vec2>((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [sum[0] / pts.length, sum[1] / pts.length];
}

// ── Cubic Bezier ─────────────────────────────

/** Evaluate a cubic bezier curve at parameter t ∈ [0, 1] */
export function cubicBezier(p0: Vec2, c1: Vec2, c2: Vec2, p1: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return [
    mt ** 3 * p0[0] + 3 * mt ** 2 * t * c1[0] + 3 * mt * t ** 2 * c2[0] + t ** 3 * p1[0],
    mt ** 3 * p0[1] + 3 * mt ** 2 * t * c1[1] + 3 * mt * t ** 2 * c2[1] + t ** 3 * p1[1],
  ];
}

/** Sample n+1 evenly-spaced points along a cubic bezier */
export function sampleCubicBezier(p0: Vec2, c1: Vec2, c2: Vec2, p1: Vec2, n = 16): Vec2[] {
  return Array.from({ length: n + 1 }, (_, i) => cubicBezier(p0, c1, c2, p1, i / n));
}

// ── SVG Path Tools ───────────────────────────

/**
 * Parse a basic closed SVG path data string into an ordered list of
 * 2D vertices (sampling curves into many points for visual approximation).
 * Handles M, L, C, Z commands only (our generated paths use only these).
 */
export function parseSvgPathToPoints(d: string, curveSamples = 12): Vec2[] {
  const tokens = d.trim().split(/[\s,]+/);
  const pts: Vec2[] = [];
  let cursor: Vec2 = [0, 0];
  let i = 0;

  const nextNum = () => parseFloat(tokens[i++]);
  const nextPt = (): Vec2 => {
    const x = nextNum();
    const y = nextNum();
    return [x, y];
  };

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M' || cmd === 'L') {
      const p = nextPt();
      pts.push(p);
      cursor = p;
    } else if (cmd === 'C') {
      const c1 = nextPt();
      const c2 = nextPt();
      const p1 = nextPt();
      const sampled = sampleCubicBezier(cursor, c1, c2, p1, curveSamples);
      // Skip first point (duplicate of cursor)
      sampled.slice(1).forEach((p) => pts.push(p));
      cursor = p1;
    } else if (cmd === 'Z' || cmd === 'z') {
      // close path — no new vertex needed
    }
  }
  return pts;
}

/**
 * Expand a closed SVG path outward by `amount` cm.
 * Uses radial inflation from the centroid — visually accurate for
 * mostly-convex shapes like jacket pattern pieces.
 * Returns a closed polygon path string (no bezier curves).
 */
export function inflatePath(d: string, amount: number): string {
  const pts = parseSvgPathToPoints(d, 16);
  if (pts.length < 3) return d;

  const c = centroid(pts);
  const inflated = pts.map((p): Vec2 => {
    const dir = norm2(sub2(p, c));
    return add2(p, scale2(dir, amount));
  });

  return (
    `M ${fmtPt(inflated[0])} ` +
    inflated.slice(1).map((p) => `L ${fmtPt(p)}`).join(' ') +
    ' Z'
  );
}

/**
 * Compute the approximate bounding box of an SVG path.
 * Returns { minX, minY, maxX, maxY, width, height }.
 */
export function pathBBox(d: string): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const pts = parseSvgPathToPoints(d, 8);
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
