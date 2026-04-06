import { useMemo } from 'react';
import * as THREE from 'three';
import type { MannequinDimensions } from '../../utils/morphWeightMapper';

// ─────────────────────────────────────────────
//  MannequinMesh — procedural tailor's mannequin
//
//  Key design:
//  • Single LatheGeometry torso (hips → shoulders) for a
//    seamless, connected body — no floating parts.
//  • LatheGeometry profile reaches shoulderHalfSpan at the
//    shoulder level so arms attach flush to the torso edge.
//  • CapsuleGeometry arms (smooth, rounded ends).
//  • Metallic stand pole + base disc below the figure.
//
//  Coordinate system: Y = 0 at hips base, builds upward.
//  All values in cm (1 scene unit = 1 cm).
// ─────────────────────────────────────────────

interface Props {
  dims: MannequinDimensions;
  wireframe: boolean;
  color: string;
}

function useBodyMat(wireframe: boolean, color: string) {
  return useMemo(
    () =>
      wireframe
        ? new THREE.MeshBasicMaterial({ color: '#94a3b8', wireframe: true })
        : new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 }),
    [wireframe, color],
  );
}

function useStandMat(wireframe: boolean) {
  return useMemo(
    () =>
      wireframe
        ? new THREE.MeshBasicMaterial({ color: '#64748b', wireframe: true })
        : new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.65 }),
    [wireframe],
  );
}

export default function MannequinMesh({ dims, wireframe, color }: Props) {
  const mat      = useBodyMat(wireframe, color);
  const standMat = useStandMat(wireframe);

  const {
    hipsRadiusZ, hipsRadiusX, hipsHeight,
    waistRadiusZ, waistHeight,
    chestRadiusZ, chestHeight,
    neckRadius, neckHeight,
    headRadius,
    shoulderHalfSpan,
    upperArmRadius, upperArmLength,
    forearmRadius, forearmLength,
    wristRadius,
  } = dims;

  // ── Key Y positions (upward from Y=0) ──────────────────────────
  const hipsTop    = hipsHeight;                               // ~16
  const waistTop   = hipsTop   + waistHeight;                  // ~22
  const chestTop   = waistTop  + chestHeight;                  // ~66
  const neckMidY   = chestTop  + neckHeight / 2;               // ~75
  const neckTopY   = chestTop  + neckHeight;                   // ~84
  const headCentY  = neckTopY  + headRadius * 0.85;            // ~95

  // Shoulder joint: flush with the outer edge of the torso at its widest point
  const shoulderY = chestTop - 4;           // Y just below top of torso
  const shoulderX = shoulderHalfSpan;       // matches LatheGeometry max radius

  // Elbow and wrist (arms hang straight down from shoulder)
  const elbowY = shoulderY - upperArmLength;
  const wristY = elbowY   - forearmLength;

  // Depth squish: human body is ~81% as deep as wide
  const depthFactor = hipsRadiusX / hipsRadiusZ;

  // ── TORSO: single LatheGeometry ─────────────────────────────────
  // Profile defines (radius, y) from bottom to top.
  // Critically, the profile reaches shoulderHalfSpan at shoulder level
  // so arms attach with no gap.
  const torsoGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [
      // Hips
      new THREE.Vector2(hipsRadiusZ * 0.52,      0),
      new THREE.Vector2(hipsRadiusZ,             hipsHeight * 0.42),   // widest hip
      new THREE.Vector2(hipsRadiusZ * 0.87,      hipsTop),             // hip/waist join
      // Waist (narrowest)
      new THREE.Vector2(waistRadiusZ * 0.80,     hipsTop + waistHeight * 0.50),
      new THREE.Vector2(waistRadiusZ * 0.88,     waistTop),
      // Chest (expanding upward)
      new THREE.Vector2(chestRadiusZ * 0.73,     waistTop + chestHeight * 0.17),
      new THREE.Vector2(chestRadiusZ * 0.92,     waistTop + chestHeight * 0.42),
      new THREE.Vector2(chestRadiusZ,            waistTop + chestHeight * 0.56),  // fullest chest
      new THREE.Vector2(chestRadiusZ * 0.97,     waistTop + chestHeight * 0.73),
      // Shoulder — expands to full shoulder width so arm meets cleanly
      new THREE.Vector2(shoulderHalfSpan * 0.92, waistTop + chestHeight * 0.87),
      new THREE.Vector2(shoulderHalfSpan,        chestTop - 4),         // shoulder max
      // Taper to neck base
      new THREE.Vector2(neckRadius * 2.2,        chestTop),
    ];

    const geo = new THREE.LatheGeometry(pts, 48);
    // Squish Z to make cross-sections elliptical (wider than deep)
    // Use a group scale in JSX for correct normal handling
    return geo;
  }, [
    hipsRadiusZ, hipsHeight, hipsTop,
    waistRadiusZ, waistTop, waistHeight,
    chestRadiusZ, chestHeight,
    shoulderHalfSpan, neckRadius,
  ]);

  // Neck cylinder
  const neckGeo = useMemo(
    () => new THREE.CylinderGeometry(neckRadius * 0.9, neckRadius * 1.3, neckHeight, 22),
    [neckRadius, neckHeight],
  );

  // Head (unit sphere, scaled in JSX)
  const headGeo = useMemo(() => new THREE.SphereGeometry(1, 28, 18), []);

  // Shoulder cap sphere (unit, scaled)
  const shoulderCapGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 14), []);

  // Upper arm capsule — CapsuleGeometry(radius, cylinderLength, capSegs, radialSegs)
  const uaLen = Math.max(upperArmLength - upperArmRadius * 2, 2);
  const upperArmGeo = useMemo(
    () => new THREE.CapsuleGeometry(upperArmRadius, uaLen, 8, 18),
    [upperArmRadius, uaLen],
  );

  // Elbow sphere (unit, scaled)
  const elbowCapGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 10), []);

  // Forearm capsule
  const faLen = Math.max(forearmLength - forearmRadius * 1.7, 2);
  const forearmGeo = useMemo(
    () => new THREE.CapsuleGeometry(forearmRadius * 0.85, faLen, 8, 18),
    [forearmRadius, faLen],
  );

  // Wrist sphere (unit, scaled)
  const wristCapGeo = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);

  // Stand
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(1.8, 2.3, 28, 18), []);
  const baseGeo = useMemo(() => new THREE.CylinderGeometry(22, 26, 3, 48), []);

  return (
    <group>
      {/* ── Stand ─────────────────────────────────────────────────── */}
      <mesh geometry={poleGeo} material={standMat} position={[0, -14, 0]} />
      <mesh geometry={baseGeo} material={standMat} position={[0, -29, 0]} />

      {/* ── Torso: wrapped in group to apply elliptical depth squish ─ */}
      <group scale={[1, 1, depthFactor]}>
        <mesh geometry={torsoGeo} material={mat} />
      </group>

      {/* ── Neck ─────────────────────────────────────────────────── */}
      <mesh geometry={neckGeo} material={mat} position={[0, neckMidY, 0]} />

      {/* ── Head ─────────────────────────────────────────────────── */}
      <mesh
        geometry={headGeo}
        material={mat}
        position={[0, headCentY, 0]}
        scale={[headRadius * 0.82, headRadius, headRadius * 0.85]}
      />

      {/* ── LEFT arm ─────────────────────────────────────────────── */}
      {/* Shoulder cap — bridges gap between torso edge and upper arm */}
      <mesh
        geometry={shoulderCapGeo}
        material={mat}
        position={[-shoulderX, shoulderY, 0]}
        scale={[upperArmRadius * 1.35, upperArmRadius * 1.2, upperArmRadius * 1.25]}
      />
      {/* Upper arm — centered between shoulder and elbow */}
      <mesh
        geometry={upperArmGeo}
        material={mat}
        position={[-shoulderX, shoulderY - upperArmLength / 2, 0]}
      />
      {/* Elbow sphere */}
      <mesh
        geometry={elbowCapGeo}
        material={mat}
        position={[-shoulderX, elbowY, 0]}
        scale={[forearmRadius * 1.1, forearmRadius, forearmRadius * 1.1]}
      />
      {/* Forearm */}
      <mesh
        geometry={forearmGeo}
        material={mat}
        position={[-shoulderX, elbowY - forearmLength / 2, 0]}
      />
      {/* Wrist cap */}
      <mesh
        geometry={wristCapGeo}
        material={mat}
        position={[-shoulderX, wristY, 0]}
        scale={[wristRadius * 1.1, wristRadius, wristRadius * 1.1]}
      />

      {/* ── RIGHT arm (mirror of left) ───────────────────────────── */}
      <mesh
        geometry={shoulderCapGeo}
        material={mat}
        position={[shoulderX, shoulderY, 0]}
        scale={[upperArmRadius * 1.35, upperArmRadius * 1.2, upperArmRadius * 1.25]}
      />
      <mesh
        geometry={upperArmGeo}
        material={mat}
        position={[shoulderX, shoulderY - upperArmLength / 2, 0]}
      />
      <mesh
        geometry={elbowCapGeo}
        material={mat}
        position={[shoulderX, elbowY, 0]}
        scale={[forearmRadius * 1.1, forearmRadius, forearmRadius * 1.1]}
      />
      <mesh
        geometry={forearmGeo}
        material={mat}
        position={[shoulderX, elbowY - forearmLength / 2, 0]}
      />
      <mesh
        geometry={wristCapGeo}
        material={mat}
        position={[shoulderX, wristY, 0]}
        scale={[wristRadius * 1.1, wristRadius, wristRadius * 1.1]}
      />
    </group>
  );
}

