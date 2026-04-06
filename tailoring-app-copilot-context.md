# 🧵 Dynamic Tailoring Pattern Creation Application
## Copilot / Cursor AI Context Document — Phase 1: Jacket

---

## 📌 PROJECT OVERVIEW

Build a browser-based, interactive tailoring application where:
1. A user enters body measurements manually
2. A 3D virtual mannequin is generated matching those exact measurements
3. Standard garment patterns (S / M / L / XL) are overlaid on the mannequin
4. Pattern pieces are auto-adjusted to fit the body measurements precisely
5. The user can customise garment details (collar type, cuff, button style, pocket, lapel, etc.)
6. Final adjusted patterns can be exported for cutting and stitching

**Phase 1 Scope:** Jacket only
**Future Phases:** Shirt, Pant, Chino, Kurta, etc.

---

## 🛠️ TECH STACK

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript |
| 3D Rendering | Three.js (r128+) with React Three Fiber |
| 3D Controls | @react-three/drei (OrbitControls, etc.) |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Pattern Drawing | SVG (rendered via D3.js or raw SVG) |
| PDF Export | jsPDF + svg2pdf.js |
| Build Tool | Vite |
| Backend (optional) | Node.js + Express (for saving patterns / user sessions) |

---

## 📐 MODULE 1 — BODY MEASUREMENT INPUT

### Purpose
Collect all necessary body measurements from the user via a structured form. These values drive both the 3D mannequin generation and the pattern adjustment engine.

### Measurements to Collect (Jacket-Specific)

```typescript
interface BodyMeasurements {
  // Core circumferences (in cm)
  chest: number;           // Full chest circumference
  waist: number;           // Natural waist circumference
  hips: number;            // Full hip circumference
  neck: number;            // Neck circumference

  // Lengths
  shoulderWidth: number;   // Shoulder point to shoulder point (across back)
  sleeveLength: number;    // Shoulder point to wrist
  jacketLength: number;    // Back neck point to desired jacket hem
  backLength: number;      // Back neck point to natural waist

  // Widths
  chestWidth: number;      // Across chest (front, armhole to armhole)
  backWidth: number;       // Across back (armhole to armhole)

  // Arm
  upperArmCircumference: number;  // Bicep circumference
  wristCircumference: number;     // Wrist circumference
  elbowCircumference: number;     // Elbow circumference

  // Height references
  totalHeight: number;     // Full body height (used to scale mannequin)
  armholeDepth: number;    // Neck to underarm (derived if not given)

  // Optional advanced
  frontChestLength?: number;  // High point shoulder to bust line
  napeToWaist?: number;       // Nape of neck to waist (back)
}
```

### UI Design Notes
- Use a **two-panel layout**: left = form input, right = live 3D mannequin preview
- Group fields into sections: *Circumferences*, *Lengths*, *Arm Measurements*
- Show a **body diagram SVG** on the form with labeled measurement arrows so users know where to measure
- Allow toggle between **cm and inches** (convert internally to cm)
- Add **"Use Standard Size"** shortcut buttons (S / M / L / XL) to pre-fill form values
- Validate: all fields must be positive numbers; waist must be < chest; etc.

---

## 🧍 MODULE 2 — 3D MANNEQUIN GENERATION

### Purpose
Generate a 3D human torso mannequin that visually represents the entered body measurements. This is a parametric mesh, not a photo-realistic avatar.

### Approach
Use **Three.js** with **parametric geometry** or morph targets on a base mesh.

### Mannequin Construction Strategy

```
Base Mesh: Low-poly humanoid torso (OBJ/GLTF format)
Morph Targets: Pre-baked blend shapes for chest, waist, hips, shoulders
Runtime Scaling: Apply per-measurement scale factors to morph weights
```

#### Option A — Morph Target Approach (Recommended for Phase 1)
- Load a base GLTF mannequin model (neutral, average body)
- Pre-define morph targets for key dimensions:
  - `morphChestExpand`, `morphWaistNarrow`, `morphShoulderWiden`, etc.
- Map user measurements to morph weights:

```typescript
function measurementsToMorphWeights(m: BodyMeasurements): MorphWeights {
  const BASE = { chest: 96, waist: 80, hips: 100, shoulderWidth: 44 }; // L size base
  return {
    chestMorph: (m.chest - BASE.chest) / BASE.chest,
    waistMorph: (m.waist - BASE.waist) / BASE.waist,
    hipsMorph: (m.hips - BASE.hips) / BASE.hips,
    shoulderMorph: (m.shoulderWidth - BASE.shoulderWidth) / BASE.shoulderWidth,
  };
}
```

#### Option B — Procedural Cylinder Stacking (Simpler MVP)
Build the mannequin from primitive shapes:
- Neck → cylinder with `neckCircumference / (2π)` radius
- Chest → ellipsoid scaled by chest/2 and backWidth/2
- Waist → pinched cylinder
- Hips → ellipsoid
- Arms → tapered cylinders from shoulder to wrist

This is faster to build but less visually accurate.

### 3D Viewer Controls
- OrbitControls: rotate, zoom, pan
- Preset view buttons: Front / Back / Side / Top
- Toggle mannequin wireframe mode (to see pattern overlay clearly)
- Mannequin color: matte grey or skin tone (user toggle)

---

## 🧩 MODULE 3 — PATTERN OVERLAY ENGINE

### Purpose
Load standard jacket pattern pieces (S/M/L/XL), display them as flat SVG panels in a "pattern view", then scale and adjust each piece according to the user's actual measurements.

### Jacket Pattern Pieces (Standard Set)
```
1. Front Body Panel (Left)
2. Front Body Panel (Right) — with button placket
3. Back Body Panel
4. Side Panel (optional depending on cut style)
5. Sleeve (Upper)
6. Sleeve (Under)
7. Collar Stand
8. Collar Fall
9. Lapel / Facing
10. Pocket Welt / Flap
11. Lining pieces (mirror of above)
```

### Pattern Data Structure

```typescript
interface PatternPiece {
  id: string;                    // e.g. "front_body_left"
  name: string;                  // Display name
  baseSize: 'S' | 'M' | 'L' | 'XL';
  svgPath: string;               // SVG path data (the seam lines)
  grainLine: { x1: number; y1: number; x2: number; y2: number };
  keyPoints: PatternKeyPoint[];  // Named anchor points for adjustment
  seamAllowance: number;         // Default: 1.5 cm
}

interface PatternKeyPoint {
  id: string;         // e.g. "shoulderNeckPoint", "chestLine", "waistLine"
  x: number;
  y: number;
  linkedMeasurement: keyof BodyMeasurements; // Which measurement drives this point
  adjustmentAxis: 'x' | 'y' | 'both';
}
```

### Pattern Adjustment Algorithm

```typescript
function adjustPattern(
  basePiece: PatternPiece,
  baseSize: StandardSizeMeasurements,
  userMeasurements: BodyMeasurements
): AdjustedPatternPiece {

  // For each key point, compute the delta from base size to user size
  const adjustedPoints = basePiece.keyPoints.map(point => {
    const baseMeasurement = baseSize[point.linkedMeasurement];
    const userMeasurement = userMeasurements[point.linkedMeasurement];
    const delta = userMeasurement - baseMeasurement;

    // Apply delta proportionally based on how many seams share this measurement
    const adjustedX = point.adjustmentAxis !== 'y'
      ? point.x + (delta / SEAM_COUNT_HORIZONTAL)
      : point.x;
    const adjustedY = point.adjustmentAxis !== 'x'
      ? point.y + (delta / SEAM_COUNT_VERTICAL)
      : point.y;

    return { ...point, x: adjustedX, y: adjustedY };
  });

  // Rebuild SVG path from adjusted key points using cubic bezier interpolation
  return rebuildSVGPath(adjustedPoints);
}
```

### Pattern View UI
- **Flat Pattern Tab**: All pattern pieces laid out flat (like a paper pattern), showing the SVG
- **3D Draped View Tab**: Pattern pieces "draped" over the mannequin surface (Three.js texture mapping)
- Highlight which piece is selected; show its measurements on hover
- Show **ease allowances** as a dashed overlay on each piece
- Color coding: Cut line (solid black), Seam line (dashed grey), Fold line (blue), Grain line (red arrow)

---

## 🎨 MODULE 4 — GARMENT CUSTOMISATION (Style Options)

### Purpose
Let the user change design details of the jacket. Each option change updates the corresponding pattern piece(s) and the 3D preview in real time.

### 4.1 Collar Types

```typescript
type CollarType =
  | 'notched_lapel'          // Classic western jacket lapel
  | 'peak_lapel'             // Formal/double-breasted peak
  | 'shawl_collar'           // Tuxedo / dinner jacket
  | 'mandarin_collar'        // Band collar, no lapel
  | 'chinese_collar'         // Similar to mandarin, slight curve
  | 'nehru_collar'           // Indian style, slightly higher band
  | 'band_collar'            // Minimal, just the stand
  | 'no_collar';             // Collarless / crew neck jacket
```

Each collar type maps to a **replacement SVG pattern piece set** (collar stand + collar fall) and a corresponding **3D collar mesh** that gets swapped onto the mannequin.

### 4.2 Lapel Options

```typescript
type LapelStyle =
  | 'notched'
  | 'peak'
  | 'shawl'
  | 'none';                  // No lapel (works with mandarin/nehru collar)

type LapelWidth = 'narrow' | 'medium' | 'wide';  // Affects pattern width
```

### 4.3 Button Configuration

```typescript
type ButtonStyle =
  | 'single_breasted_1btn'
  | 'single_breasted_2btn'
  | 'single_breasted_3btn'
  | 'double_breasted_4btn'   // 2x2
  | 'double_breasted_6btn'   // 3x2
  | 'hidden_placket';        // Buttons hidden under fly front

interface ButtonConfig {
  style: ButtonStyle;
  buttonCount: number;        // Derived from style
  buttonSize: number;         // Diameter in mm (default 20mm for jacket)
  buttonholeType: 'horizontal' | 'vertical';
  // Note: Double-breasted also changes front panel overlap width in pattern
}
```

### 4.4 Pocket Types

```typescript
type PocketType =
  | 'no_pocket'
  | 'welt_pocket'             // Classic single welt
  | 'double_welt_pocket'      // Jetted pocket
  | 'flap_pocket'             // With button flap
  | 'patch_pocket'            // Stitched on outside
  | 'ticket_pocket';          // Small upper welt (above main welt)

interface PocketConfig {
  chestPocket: PocketType;    // Usually welt or patch
  sidePockets: PocketType;    // Left + right
  includeTicketPocket: boolean;
  pocketWidth: number;        // in cm
  pocketPosition: number;     // Distance from waist seam in cm
}
```

### 4.5 Sleeve & Cuff Options

```typescript
type SleeveStyle =
  | 'two_piece_sleeve'        // Classic tailored jacket sleeve
  | 'one_piece_sleeve'        // Simpler construction
  | 'raglan_sleeve';          // Diagonal seam from underarm to collar

type CuffStyle =
  | 'functioning_buttons'     // 3-4 buttons on sleeve hem (surgeon cuff)
  | 'decorative_buttons'      // Sewn closed but has buttons
  | 'plain_hem'               // No buttons
  | 'turnback_cuff';          // Folded back cuff

interface CuffConfig {
  style: CuffStyle;
  buttonCount: 1 | 2 | 3 | 4;  // Number of cuff buttons
}
```

### 4.6 Back Style

```typescript
type BackVent =
  | 'no_vent'
  | 'center_vent'             // Single vent at center back hem
  | 'side_vents';             // Two vents at side seams

type BackSeam =
  | 'no_seam'                 // Clean back, single panel
  | 'center_seam'             // Seam at center back (for fitting)
  | 'princess_seam';          // Curved seam for close fit
```

### 4.7 Lining Options

```typescript
interface LiningConfig {
  fullyLined: boolean;
  halfLined: boolean;         // Only back lining
  noLining: boolean;
  liningColor: string;        // Hex color for 3D preview
}
```

### Style Options Panel UI
- Sidebar accordion with sections: Collar, Lapel, Buttons, Pockets, Sleeves, Back, Lining
- Each option shows an **icon or small sketch thumbnail** of the style
- Selecting an option instantly updates both the 3D mannequin and the pattern SVG
- Show a "Style Summary" card that lists all chosen options

---

## 📏 MODULE 5 — MEASUREMENT COMPARISON & ADJUSTMENT DISPLAY

### Purpose
Show the user exactly what changes were made to the base pattern, and by how much.

### Adjustment Report UI

```
Pattern Piece       | Base (L)  | Your Size | Adjustment
--------------------|-----------|-----------|------------
Front Body Width    | 52.0 cm   | 55.5 cm   | +3.5 cm ✅
Back Body Length    | 46.0 cm   | 44.0 cm   | -2.0 cm ✅
Sleeve Length       | 62.0 cm   | 65.0 cm   | +3.0 cm ✅
Collar Stand Height | 3.5 cm    | 3.5 cm    | No change
```

- Green checkmarks for valid adjustments
- Yellow warnings for adjustments > 5 cm (may affect fit quality; recommend professional fitting)
- Red errors for impossible adjustments (e.g., chest – waist delta is extreme)

---

## 📤 MODULE 6 — EXPORT & PRINT

### Export Options

```typescript
interface ExportConfig {
  format: 'PDF' | 'SVG' | 'DXF';  // DXF for CAD/cutting machines
  scale: '1:1' | '1:5' | '1:10'; // 1:1 = actual size for printing
  paperSize: 'A4' | 'A3' | 'A0' | 'Letter';
  includeSewingInstructions: boolean;
  includeGrainLines: boolean;
  includeSeamAllowance: boolean;
  includeNotches: boolean;         // Alignment marks between pieces
  includeStyleSummary: boolean;    // Print the chosen options summary
  splitAcrossPages: boolean;       // For A4 tiling of large 1:1 patterns
}
```

### Print Layout
- Each pattern piece gets its own page (or tiled section for large pieces)
- Include: piece name, grain line arrow, "Cut 2" / "Cut 1 on fold" instructions, seam allowance width
- Tile alignment marks (crosshairs) for multi-page assembly

---

## 🗂️ APPLICATION STATE STRUCTURE (Zustand Store)

```typescript
interface AppState {
  // Measurements
  measurements: BodyMeasurements;
  setMeasurements: (m: Partial<BodyMeasurements>) => void;

  // Garment
  garmentType: 'jacket' | 'shirt' | 'pant';  // Phase 1: jacket only
  baseSize: 'S' | 'M' | 'L' | 'XL';
  setBaseSize: (s: BaseSize) => void;

  // Style Choices
  styleOptions: JacketStyleOptions;
  setStyleOption: <K extends keyof JacketStyleOptions>(key: K, value: JacketStyleOptions[K]) => void;

  // Pattern
  patternPieces: AdjustedPatternPiece[];
  adjustmentReport: AdjustmentReport;

  // UI
  activeView: 'measurements' | 'mannequin' | 'pattern' | 'export';
  selectedPatternPiece: string | null;
  mannequinWireframe: boolean;
}
```

---

## 🗺️ PAGE / VIEW FLOW

```
[1. MEASUREMENT INPUT]
    ↓ (user fills form or picks standard size)
[2. MANNEQUIN PREVIEW]
    ↓ (mannequin generated; user can rotate/inspect)
[3. BASE PATTERN OVERLAY]
    ↓ (standard size pattern applied; user selects base size)
[4. PATTERN ADJUSTMENT]
    ↓ (auto-adjusted to user measurements; adjustments shown)
[5. STYLE CUSTOMISATION]
    ↓ (user picks collar, buttons, pockets, etc.)
[6. FINAL REVIEW]
    ↓ (3D preview + adjustment report)
[7. EXPORT]
    → PDF / SVG / DXF download
```

---

## 📁 FOLDER STRUCTURE

```
/src
  /components
    /MeasurementForm
      MeasurementForm.tsx         — Form UI with grouped inputs
      MeasurementDiagram.tsx      — SVG body diagram with labels
      SizePresets.tsx             — S/M/L/XL quick-fill buttons
    /Mannequin
      MannequinViewer.tsx         — Three.js canvas (React Three Fiber)
      MannequinMesh.tsx           — Parametric mannequin geometry
      MorphController.ts          — Maps measurements to morph weights
    /PatternEngine
      PatternPiece.tsx            — Renders a single SVG pattern piece
      PatternCanvas.tsx           — All pieces laid out flat
      PatternAdjuster.ts          — Core adjustment algorithm
      PatternOverlay3D.tsx        — Drapes pattern on mannequin
    /StyleOptions
      CollarSelector.tsx
      LapelSelector.tsx
      ButtonSelector.tsx
      PocketSelector.tsx
      SleeveSelector.tsx
      BackSelector.tsx
    /AdjustmentReport
      ReportTable.tsx
    /Export
      ExportPanel.tsx
      PatternTiler.ts             — A4 tiling logic for 1:1 print
  /store
    appStore.ts                   — Zustand global store
  /data
    /patterns
      jacket_front_L.svg          — Base SVG pattern pieces per size
      jacket_back_L.svg
      jacket_sleeve_L.svg
      ...
    standardSizes.ts              — S/M/L/XL measurement lookup table
    patternPieceConfig.ts         — Key point definitions per piece
  /utils
    measurementConverter.ts       — cm ↔ inches
    patternMath.ts                — Bezier interpolation, seam geometry
    morphWeightMapper.ts
  /types
    measurements.types.ts
    pattern.types.ts
    style.types.ts
  /assets
    /models
      mannequin_base.glb          — Base 3D mannequin GLTF model
    /icons
      collar_mandarin.svg         — Style option thumbnails
      collar_notched.svg
      ...
```

---

## 🔢 STANDARD SIZE REFERENCE TABLE

```typescript
const STANDARD_SIZES = {
  S:  { chest: 88,  waist: 72,  hips: 92,  shoulderWidth: 42, jacketLength: 70, sleeveLength: 60 },
  M:  { chest: 96,  waist: 80,  hips: 100, shoulderWidth: 44, jacketLength: 72, sleeveLength: 62 },
  L:  { chest: 104, waist: 88,  hips: 108, shoulderWidth: 46, jacketLength: 74, sleeveLength: 63 },
  XL: { chest: 112, waist: 96,  hips: 116, shoulderWidth: 48, jacketLength: 76, sleeveLength: 64 },
};
// All values in cm. Use L as the default base pattern.
```

---

## ⚙️ KEY IMPLEMENTATION NOTES FOR COPILOT / CURSOR

1. **Always use TypeScript** — strict mode enabled. All interfaces in `/types`.

2. **Pattern math is critical** — The bezier curve interpolation between key pattern points must preserve smooth curves. Use `cubic-bezier` control point recalculation when any key point moves. Do NOT use simple linear interpolation for curved seams.

3. **3D mannequin is visual only** — It does not need to be anatomically perfect. It just needs to reflect the proportions of the entered measurements clearly. Prioritise clarity over realism.

4. **Pattern SVGs are the real deliverable** — The 3D mannequin is a preview aid. The actual output is the adjusted SVG pattern. All export logic focuses on pattern accuracy.

5. **Ease allowance is separate from adjustment** — Body measurements are net (body size). Ease (comfort room) is added on top as a configurable setting per garment type. Default jacket ease: chest +8 cm, waist +6 cm, hips +6 cm.

6. **Style options affect specific pattern pieces only** — e.g., changing collar only regenerates collar SVG pieces; front body is untouched. Optimise re-renders accordingly.

7. **Seam allowance is NOT included in the pattern lines** — Show seam line (stitching line) and cut line separately. Default SA = 1.5 cm for body seams, 1.0 cm for collar, 3.0 cm for hem.

8. **For Phase 2 (Shirt, Pant)** — The same `PatternAdjuster.ts` and `AppState` structure must be reused. Only the pattern piece configs, style options, and measurements will differ. Design for extensibility from the start.

---

## 🚀 PHASE 2 PREPARATION (Do Not Build Yet — Design For It)

| Phase | Garment | New Style Options Needed |
|---|---|---|
| 2A | Shirt | Collar (spread, cutaway, button-down, band), Sleeve (full, half, rolled), Cuff (barrel, french, mandarin), Placket, Yoke |
| 2B | Trouser | Waistband, Pleats (flat front, 1-pleat, 2-pleat), Hem (plain, cuff/turn-up), Fly (zip, button), Belt loops |
| 2C | Chino | Same as trouser with additional casual pocket options |

---

## ✅ MVP CHECKLIST (Phase 1)

- [ ] Measurement input form with validation
- [ ] Standard size presets (S/M/L/XL)
- [ ] 3D mannequin rendering from measurements
- [ ] OrbitControls on mannequin (rotate/zoom)
- [ ] Base jacket pattern pieces (SVG) for L size
- [ ] Pattern adjustment engine
- [ ] Adjustment report table
- [ ] Collar type selector (min. 5 collar types)
- [ ] Button style selector
- [ ] Pocket type selector
- [ ] Back vent selector
- [ ] Cuff style selector
- [ ] PDF export (A4 tiled, 1:1 scale)
- [ ] SVG export

---

*This document is the canonical reference for the AI coding assistant. When implementing any module, refer back to the types, structure, and notes above. Do not deviate from the TypeScript interfaces defined here without updating this document first.*
