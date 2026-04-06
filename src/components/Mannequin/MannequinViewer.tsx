import { useRef, useCallback, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import MannequinMesh from './MannequinMesh';
import { useMorphController } from './MorphController';
import { useAppStore } from '../../store/appStore';
import PatternOverlay3D from '../PatternEngine/PatternOverlay3D';
import { computeAdjustedPieces } from '../PatternEngine/PatternAdjuster';

// ─────────────────────────────────────────────
//  Camera preset positions
// ─────────────────────────────────────────────

type ViewPreset = 'front' | 'back' | 'side' | 'top';

// Figure spans Y=-30 (stand base) to Y≈96 (head top); centre at Y≈45
const CAM_POSITIONS: Record<ViewPreset, THREE.Vector3Tuple> = {
  front: [0,   50, 230],
  back:  [0,   50, -230],
  side:  [230, 50, 0],
  top:   [0,   340, 1],
};

const CAM_TARGETS: Record<ViewPreset, THREE.Vector3Tuple> = {
  front: [0, 45, 0],
  back:  [0, 45, 0],
  side:  [0, 45, 0],
  top:   [0, 45, 0],
};

// ─────────────────────────────────────────────
//  Inner scene — has access to R3F context
// ─────────────────────────────────────────────

interface SceneProps {
  color: string;
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
  pendingView: ViewPreset | null;
  onViewApplied: () => void;
  showOverlay: boolean;
}

function MannequinScene({ color, orbitRef, pendingView, onViewApplied, showOverlay }: SceneProps) {
  const measurements   = useAppStore((s) => s.measurements);
  const wireframe      = useAppStore((s) => s.mannequinWireframe);
  const styleOptions   = useAppStore((s) => s.styleOptions);
  const baseSize       = useAppStore((s) => s.baseSize);
  const { dims }       = useMorphController(measurements);
  const { camera }     = useThree();

  // Compute pattern pieces only when the overlay is active
  const overlayPieces = useMemo(
    () => (showOverlay ? computeAdjustedPieces(measurements, baseSize, styleOptions) : []),
    [showOverlay, measurements, baseSize, styleOptions],
  );
  // Apply view preset via animation each frame
  useFrame(() => {
    if (pendingView && orbitRef.current) {
      const targetPos = new THREE.Vector3(...CAM_POSITIONS[pendingView]);
      const targetLook = new THREE.Vector3(...CAM_TARGETS[pendingView]);

      camera.position.lerp(targetPos, 0.12);
      orbitRef.current.target.lerp(targetLook, 0.12);
      orbitRef.current.update();

      if (camera.position.distanceTo(targetPos) < 1) {
        camera.position.copy(targetPos);
        orbitRef.current.target.copy(targetLook);
        orbitRef.current.update();
        onViewApplied();
      }
    }
  });

  // Orbit target: waist+chest midpoint — gives a balanced view of the whole figure
  const centreY = dims.hipsHeight + dims.waistHeight + dims.chestHeight * 0.45;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={1.2} castShadow />
      <directionalLight position={[-80, 100, -80]} intensity={0.4} />
      <pointLight position={[0, 200, 60]} intensity={0.3} />

      {/* Environment */}
      <Environment preset="city" />

      {/* Grid floor */}
      <Grid
        position={[0, -1, 0]}
        args={[400, 400]}
        cellSize={10}
        cellThickness={0.4}
        cellColor="#cbd5e1"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#94a3b8"
        fadeDistance={400}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Mannequin mesh */}
      <group position={[0, 0, 0]}>
        <MannequinMesh dims={dims} wireframe={wireframe} color={color} />
      </group>

      {/* Pattern overlay — pieces positioned around the mannequin */}
      {showOverlay && overlayPieces.length > 0 && (
        <PatternOverlay3D pieces={overlayPieces} dims={dims} />
      )}

      <OrbitControls
        ref={orbitRef as unknown as React.RefObject<OrbitControlsImpl>}
        target={[0, centreY, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={40}
        maxDistance={500}
      />
    </>
  );
}

// ─────────────────────────────────────────────
//  Toolbar — wireframe, color & view presets
// ─────────────────────────────────────────────

const VIEW_BTNS: { id: ViewPreset; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back',  label: 'Back' },
  { id: 'side',  label: 'Side' },
  { id: 'top',   label: 'Top' },
];

const COLORS = [
  { hex: '#b0bec5', label: 'Grey (default)' },
  { hex: '#f5cba7', label: 'Skin tone' },
  { hex: '#1e293b', label: 'Dark slate' },
  { hex: '#bfdbfe', label: 'Ice blue' },
];

interface ToolbarProps {
  onSetView: (v: ViewPreset) => void;
  activeView: ViewPreset;
  color: string;
  onColorChange: (c: string) => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
}

function ViewerToolbar({ onSetView, activeView, color, onColorChange, showOverlay, onToggleOverlay }: ToolbarProps) {
  const wireframe     = useAppStore((s) => s.mannequinWireframe);
  const toggleWireframe = useAppStore((s) => s.toggleWireframe);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const measurements  = useAppStore((s) => s.measurements);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
      {/* Left: view presets */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-slate-500 mr-1">View:</span>
        {VIEW_BTNS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSetView(id)}
            className={[
              'px-3 py-1 rounded text-xs font-medium transition-colors border',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              activeView === id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Centre: wireframe + color */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleWireframe}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            wireframe
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
          ].join(' ')}
          aria-pressed={wireframe}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="1"/>
            <line x1="2" y1="8" x2="14" y2="8"/>
            <line x1="8" y1="2" x2="8" y2="14"/>
          </svg>
          Wireframe
        </button>

        {/* Pattern overlay toggle */}
        <button
          type="button"
          onClick={onToggleOverlay}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            showOverlay
              ? 'bg-primary-700 text-white border-primary-700'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
          ].join(' ')}
          aria-pressed={showOverlay}
          title="Drape pattern pieces over the mannequin"
        >
          {/* jacket icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 2 L1 5 L3 14 L13 14 L15 5 L11 2"/>
            <path d="M5 2 C5 4 8 5 8 7"/>
            <path d="M11 2 C11 4 8 5 8 7"/>
          </svg>
          Pattern Fit
        </button>

        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Colour:</span>
          {COLORS.map(({ hex, label }) => (
            <button
              key={hex}
              type="button"
              onClick={() => onColorChange(hex)}
              title={label}
              aria-pressed={color === hex}
              className={[
                'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-500',
                color === hex ? 'border-primary-600 scale-110' : 'border-transparent',
              ].join(' ')}
              style={{ background: hex }}
            />
          ))}
        </div>
      </div>

      {/* Right: measurement summary + next step */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 hidden sm:inline">
          Chest {measurements.chest} · Waist {measurements.waist} · Height {measurements.totalHeight} cm
        </span>
        <button
          type="button"
          onClick={() => setActiveView('pattern')}
          className={[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
            'bg-primary-600 text-white hover:bg-primary-700 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          ].join(' ')}
        >
          View Pattern →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Measurement heads-up overlay (inside canvas)
// ─────────────────────────────────────────────

function MeasurementOverlay() {
  const m = useAppStore((s) => s.measurements);

  const rows = [
    { label: 'Chest',    value: m.chest },
    { label: 'Waist',    value: m.waist },
    { label: 'Hips',     value: m.hips },
    { label: 'Shoulder', value: m.shoulderWidth },
    { label: 'Sleeve',   value: m.sleeveLength },
    { label: 'Height',   value: m.totalHeight },
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow text-xs min-w-[120px]">
      <p className="font-semibold text-slate-700 mb-1.5">Your Measurements</p>
      <table className="w-full">
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label} className="leading-5">
              <td className="text-slate-500 pr-2">{label}</td>
              <td className="text-right font-medium text-slate-700">{value} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main MannequinViewer export
// ─────────────────────────────────────────────

export default function MannequinViewer() {
  const orbitRef   = useRef<OrbitControlsImpl | null>(null);
  const [pendingView, setPendingView]   = useState<ViewPreset | null>(null);
  const [currentView, setCurrentView]  = useState<ViewPreset>('front');
  const [color, setColor]              = useState(COLORS[0].hex);
  const [showOverlay, setShowOverlay]  = useState(false);
  const setActiveAppView = useAppStore((s) => s.setActiveView);

  const handleSetView = useCallback((v: ViewPreset) => {
    setPendingView(v);
    setCurrentView(v);
  }, []);

  const handleViewApplied = useCallback(() => setPendingView(null), []);
  const handleToggleOverlay = useCallback(() => setShowOverlay((v) => !v), []);

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900"
         style={{ height: 'calc(100vh - 160px)', minHeight: 520 }}>
      {/* Toolbar */}
      <ViewerToolbar
        onSetView={handleSetView}
        activeView={currentView}
        color={color}
        onColorChange={setColor}
        showOverlay={showOverlay}
        onToggleOverlay={handleToggleOverlay}
      />

      {/* Canvas */}
      <div className="relative flex-1">
        <Canvas
          shadows
          camera={{ position: [0, 50, 230], fov: 40, near: 1, far: 2000 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#111827' }}
        >
          <MannequinScene
            color={color}
            orbitRef={orbitRef as React.RefObject<OrbitControlsImpl>}
            pendingView={pendingView}
            onViewApplied={handleViewApplied}
            showOverlay={showOverlay}
          />
        </Canvas>

        {/* Measurement overlay */}
        <MeasurementOverlay />

        {/* Pattern overlay legend */}
        {showOverlay && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow text-xs max-w-[180px]">
            <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-600 inline-block" />
              Pattern Fit
            </p>
            <ul className="space-y-1">
              {([
                { id: 'jacket_front',        color: '#93c5fd', label: 'Front Panel' },
                { id: 'jacket_back',         color: '#86efac', label: 'Back Panel' },
                { id: 'jacket_sleeve_upper', color: '#fdba74', label: 'Sleeve Upper' },
                { id: 'jacket_sleeve_under', color: '#fbcfe8', label: 'Sleeve Under' },
                { id: 'jacket_collar',       color: '#c4b5fd', label: 'Collar' },
              ] as const).map(({ color: c, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm border border-slate-300 flex-shrink-0" style={{ background: c }} />
                  <span className="text-slate-600">{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-slate-400 leading-tight">Orbit to view all sides. Pieces mirror symmetrically.</p>
          </div>
        )}

        {/* Back to measurements */}
        <button
          type="button"
          onClick={() => setActiveAppView('measurements')}
          className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 3L5 8l5 5"/>
          </svg>
          Measurements
        </button>
      </div>
    </div>
  );
}
