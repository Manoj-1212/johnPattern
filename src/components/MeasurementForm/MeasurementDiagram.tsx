// ─────────────────────────────────────────────
//  MeasurementDiagram — annotated SVG body figure
//  showing where each measurement is taken
// ─────────────────────────────────────────────

interface Props {
  highlightGroup?: string;
}

// Helper: a simple measurement label with leader line
function Label({
  x, y, text, anchor = 'start',
}: {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize="9"
      fill="#475569"
      fontFamily="Inter, system-ui, sans-serif"
    >
      {text}
    </text>
  );
}

function LeaderLine({
  x1, y1, x2, y2,
}: {
  x1: number; y1: number; x2: number; y2: number;
}) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#94a3b8"
      strokeWidth="0.8"
      strokeDasharray="2,2"
    />
  );
}

// Double-headed arrow helper
function Arrow({
  x1, y1, x2, y2, color = '#0ea5e9',
}: {
  x1: number; y1: number; x2: number; y2: number; color?: string;
}) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth="1.2"
      markerEnd="url(#arrowhead)"
      markerStart="url(#arrowhead)"
    />
  );
}

export default function MeasurementDiagram({ highlightGroup }: Props) {
  const isHighlighted = (group: string) =>
    !highlightGroup || highlightGroup === group;

  const circColor  = isHighlighted('circumferences') ? '#0ea5e9' : '#cbd5e1';
  const lengColor  = isHighlighted('lengths')        ? '#10b981' : '#cbd5e1';
  const widthColor = isHighlighted('widths')         ? '#f59e0b' : '#cbd5e1';
  const armColor   = isHighlighted('arm')            ? '#8b5cf6' : '#cbd5e1';

  return (
    <svg
      viewBox="0 0 220 420"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Body measurement diagram"
      className="w-full h-full max-h-[420px]"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="4"
          markerHeight="4"
          refX="2"
          refY="2"
          orient="auto"
        >
          <path d="M0,0 L4,2 L0,4 Z" fill="#0ea5e9" />
        </marker>
      </defs>

      {/* ── Body outline ──────────────────────────── */}
      {/* Head */}
      <ellipse cx="110" cy="28" rx="20" ry="24" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2" />

      {/* Neck */}
      <rect x="103" y="50" width="14" height="14" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2" />

      {/* Shoulders */}
      <path
        d="M103 64 Q78 60 62 72 L62 100 Q62 100 78 100 L78 80 L103 78 Z"
        fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2"
      />
      <path
        d="M117 64 Q142 60 158 72 L158 100 Q158 100 142 100 L142 80 L117 78 Z"
        fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2"
      />

      {/* Torso */}
      <path
        d="M78 78 L78 220 Q78 228 88 232 L110 236 L132 232 Q142 228 142 220 L142 78 Z"
        fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2"
      />

      {/* Arms */}
      {/* Left arm */}
      <path
        d="M62 72 L48 78 L44 180 Q44 188 48 190 L60 190 L64 110 L78 100 Z"
        fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2"
      />
      {/* Right arm */}
      <path
        d="M158 72 L172 78 L176 180 Q176 188 172 190 L160 190 L156 110 L142 100 Z"
        fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2"
      />

      {/* Legs (simplified) */}
      <rect x="84" y="236" width="22" height="120" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2" />
      <rect x="114" y="236" width="22" height="120" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2" />

      {/* ── Circumference arrows ───────────────────
           chest ≈ y=96, waist ≈ y=148, hips ≈ y=196 */}
      {/* Chest line */}
      <line x1="78"  y1="96" x2="142" y2="96" stroke={circColor} strokeWidth="1.6" strokeDasharray="3,2" />
      <LeaderLine x1={142} y1={96} x2={175} y2={95} />
      <Label x={177} y={98} text="Chest" />

      {/* Waist line */}
      <line x1="80"  y1="148" x2="140" y2="148" stroke={circColor} strokeWidth="1.6" strokeDasharray="3,2" />
      <LeaderLine x1={140} y1={148} x2={175} y2={147} />
      <Label x={177} y={150} text="Waist" />

      {/* Hips line */}
      <line x1="80"  y1="196" x2="140" y2="196" stroke={circColor} strokeWidth="1.6" strokeDasharray="3,2" />
      <LeaderLine x1={140} y1={196} x2={175} y2={195} />
      <Label x={177} y={198} text="Hips" />

      {/* Neck */}
      <line x1="103" y1="54" x2="117" y2="54" stroke={circColor} strokeWidth="1.6" strokeDasharray="3,2" />
      <LeaderLine x1={103} y1={54} x2={30} y2={60} />
      <Label x={4} y={62} text="Neck" />

      {/* ── Length arrows ──────────────────────── */}
      {/* Jacket length: nape (y=53) to hem (y=224) */}
      <Arrow x1={20} y1={53} x2={20} y2={224} color={lengColor} />
      <LeaderLine x1={20} y1={53}  x2={108} y2={53} />
      <LeaderLine x1={20} y1={224} x2={88}  y2={224} />
      <Label x={2} y={44} text="Jacket" anchor="start" />
      <Label x={2} y={52} text="Length" anchor="start" />

      {/* Back length: nape to waist */}
      <Arrow x1={34} y1={53} x2={34} y2={148} color={lengColor} />

      {/* Sleeve length: shoulder point to wrist */}
      <Arrow x1={158} y1={72} x2={176} y2={185} color={lengColor} />
      <LeaderLine x1={176} y1={185} x2={195} y2={192} />
      <Label x={196} y={196} text="Sleeve" />
      <Label x={196} y={204} text="Length" />

      {/* ── Width arrows ───────────────────────── */}
      {/* Shoulder width */}
      <line x1="62" y1="68" x2="158" y2="68" stroke={widthColor} strokeWidth="1.4" />
      <LeaderLine x1={110} y1={68} x2={110} y2={54} />
      <Label x={108} y={50} text="Shoulder" anchor="middle" />

      {/* Chest width (front) */}
      <line x1="84" y1="88" x2="136" y2="88" stroke={widthColor} strokeWidth="1.4" />

      {/* Back width */}
      <line x1="84" y1="104" x2="136" y2="104" stroke={widthColor} strokeWidth="1.4" />

      {/* ── Arm arrows ─────────────────────────── */}
      {/* Upper arm circumference ≈ y=110 on left arm */}
      <line x1="44" y1="110" x2="64" y2="110" stroke={armColor} strokeWidth="1.4" strokeDasharray="3,2" />
      <LeaderLine x1={44} y1={110} x2={28} y2={118} />
      <Label x={2} y={122} text="Upper" />
      <Label x={2} y={130} text="Arm" />

      {/* Elbow ≈ y=152 on left arm */}
      <line x1="44" y1="152" x2="62" y2="152" stroke={armColor} strokeWidth="1.4" strokeDasharray="3,2" />
      <LeaderLine x1={44} y1={152} x2={28} y2={160} />
      <Label x={2} y={163} text="Elbow" />

      {/* Wrist ≈ y=188 */}
      <line x1="44" y1="186" x2="60" y2="186" stroke={armColor} strokeWidth="1.4" strokeDasharray="3,2" />
      <LeaderLine x1={44} y1={186} x2={28} y2={194} />
      <Label x={2} y={197} text="Wrist" />

      {/* ── Height ─────────────────────────────── */}
      <LeaderLine x1={200} y1={4}   x2={130} y2={6} />
      <LeaderLine x1={200} y1={356} x2={130} y2={356} />
      <line x1="200" y1="4" x2="200" y2="356" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,3" />
      <Label x={178} y={10} text="Height" />

      {/* Legend */}
      <g transform="translate(2, 370)">
        <rect x="0" y="0" width="8" height="3" fill="#0ea5e9" />
        <text x="11" y="4" fontSize="7.5" fill="#475569">Circumferences</text>
        <rect x="0" y="8" width="8" height="3" fill="#10b981" />
        <text x="11" y="12" fontSize="7.5" fill="#475569">Lengths</text>
        <rect x="70" y="0" width="8" height="3" fill="#f59e0b" />
        <text x="81" y="4" fontSize="7.5" fill="#475569">Widths</text>
        <rect x="70" y="8" width="8" height="3" fill="#8b5cf6" />
        <text x="81" y="12" fontSize="7.5" fill="#475569">Arm</text>
      </g>
    </svg>
  );
}
