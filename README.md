# John Pattern — 3D Tailoring Pattern App

A browser-based tailoring pattern drafting tool that takes body measurements, generates real jacket patterns, and displays them draped over an interactive 3D mannequin.

---

## Live Demo / Deployment

> **Stack:** Vite 5 + React 18 + TypeScript · Three.js / React Three Fiber · Zustand · Tailwind CSS

The app is a pure client-side SPA — no backend required. Deploy the `dist/` folder to any static host.

---

## Features

| Module | Description |
|--------|-------------|
| **1 — Measurement Input** | Form for all body measurements (chest, waist, hips, shoulder, sleeve, height, etc.) with unit toggle (cm / inch) and validation |
| **2 — 3D Mannequin** | Procedural LatheGeometry mannequin that morphs in real-time to match entered measurements. Wireframe toggle, four camera presets, colour swatches |
| **3 — Pattern Engine** | SVG jacket pattern auto-drafted from measurements using standard tailoring geometry (front panel, back panel, sleeve upper/under, collar) |
| **4 — Garment Customisation** | Style selectors for collar type, lapel, buttons, pockets, sleeve style, cuffs, back vent, lining colour |
| **5 — Adjustment Report** | Measurement-vs-base-size comparison table, stat cards, filter tabs and warnings for pieces that need modification |
| **6 — Export & Print** | Download pattern as **PDF** (A4/A3/Letter with tiling for 1:1 print), **SVG**, or **DXF** (AutoCAD R12 — opens in all CAD tools) |
| **Pattern Fit (3D Overlay)** | Toggle in the mannequin view that drapes all five pattern pieces over the 3D body with fabric grain texture, seam lines, and grain-line arrows |

---

## Getting Started

### Prerequisites

- **Node.js ≥ 18** (tested on 18.20.4)
- npm ≥ 9

### Install & develop

```bash
git clone https://github.com/Manoj-1212/johnPattern.git
cd johnPattern
npm install
npm run dev
```

The dev server starts at **http://127.0.0.1:3737** (configured in `vite.config.ts`).

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview with:

```bash
npm run preview
```

---

## Deployment

### Option A — Netlify (recommended, free)

1. Push this repo to GitHub (already done if you're reading this).
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**.
3. Select this repo.
4. Set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**.

Netlify auto-deploys on every push to `master`.

### Option B — Vercel

```bash
npm i -g vercel
vercel --prod
```

Accept defaults. Vercel auto-detects Vite.

### Option C — GitHub Pages

```bash
npm run build
# Push the dist/ folder to gh-pages branch, or use the gh-pages package:
npm install --save-dev gh-pages
# Add to package.json scripts: "deploy": "gh-pages -d dist"
npm run deploy
```

> **Important:** For GitHub Pages sub-path hosting add `base: '/johnPattern/'` to `vite.config.ts`.

### Option D — Apache / XAMPP (local)

The project is already in `C:\xampp\htdocs\tailoring_pattern`. After `npm run build`, copy or configure a VirtualHost pointing at `dist/`. Alternatively run `npm run preview` (serves on port 4173).

---

## Project Structure

```
src/
├── App.tsx                        # Root component, 6-step navigation
├── store/
│   └── appStore.ts                # Zustand global state
├── types/
│   ├── measurements.types.ts
│   ├── pattern.types.ts
│   └── style.types.ts
├── data/
│   ├── jacketPatterns.ts          # Pattern drafting geometry (all 5 pieces)
│   └── standardSizes.ts           # S / M / L / XL base measurements + ease
├── utils/
│   ├── patternMath.ts             # Vec2 helpers, bezier sampling, pathBBox
│   └── morphWeightMapper.ts       # Measurements → 3D mannequin dimensions
├── components/
│   ├── MeasurementForm/           # Module 1
│   ├── Mannequin/                 # Module 2 (MannequinViewer, MannequinMesh, MorphController)
│   ├── PatternEngine/             # Module 3 + Pattern Fit overlay
│   │   ├── PatternCanvas.tsx      # SVG 2D pattern view
│   │   ├── PatternAdjuster.ts     # Compute adjusted pieces vs base size
│   │   └── PatternOverlay3D.tsx   # 3D draping overlay on mannequin
│   ├── StyleOptions/              # Module 4
│   ├── AdjustmentReport/          # Module 5
│   └── Export/                    # Module 6 (PDF / SVG / DXF)
│       ├── ExportPanel.tsx
│       └── PatternTiler.ts        # DXF R12, SVG, PDF builders
```

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.2 | Type safety (strict mode) |
| Vite | 5.4 | Build tool / dev server |
| Three.js | 0.169 | 3D rendering |
| @react-three/fiber | 8.17 | React renderer for Three.js |
| @react-three/drei | 9.117 | Camera controls, helpers |
| Zustand | 5.0 | Global state (measurements, view, patterns) |
| Tailwind CSS | 3.4 | Utility-first styling |
| jsPDF | 2.5.2 | PDF export |

---

## DXF Export Notes

The DXF exporter produces **AutoCAD R12 (AC1009)** format using native `POLYLINE` / `VERTEX` / `SEQEND` entities (not `LWPOLYLINE`). This ensures compatibility with:
- AutoCAD (all versions)
- LibreCAD / FreeCAD
- Inkscape (via DXF import)
- CNC cutting plotters

Units: centimetres (`$INSUNITS = 5`). `$EXTMIN` / `$EXTMAX` are set from actual geometry so the file opens already zoomed to the pattern.

---

## Development Notes

- All pattern coordinates in **cm**; 1 Three.js scene unit = 1 cm.
- Mannequin Y=0 is at hips base; pattern Y=0 is at HPS (High Point Shoulder). The 3D overlay maps between them via `mannequinY = shoulderY − patternY`.
- The `PatternAdjuster` stores the **base-size path** in `svgPath` and the **user-measurement path** in `adjustedSvgPath` on each `AdjustedPatternPiece`.
- `patternMath.pathBBox` handles M / L / C / Z SVG commands.

---

## License

Private / proprietary — all rights reserved.


If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
