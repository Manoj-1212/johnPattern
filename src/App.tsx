import './App.css';
import MeasurementPanel from './components/MeasurementForm/MeasurementPanel';
import MannequinViewer from './components/Mannequin/MannequinViewer';
import PatternCanvas from './components/PatternEngine/PatternCanvas';
import AdjustmentPanel from './components/AdjustmentReport/AdjustmentPanel';
import StylePanel from './components/StyleOptions/StylePanel';
import ExportPanel from './components/Export/ExportPanel';
import { useAppStore } from './store/appStore';

// ─────────────────────────────────────────────
//  Navigation step tabs (Module flow)
// ─────────────────────────────────────────────

const STEPS = [
  { id: 'measurements', label: '1. Measurements' },
  { id: 'mannequin',    label: '2. Mannequin' },
  { id: 'pattern',      label: '3. Pattern' },
  { id: 'report',       label: '4. Report' },
  { id: 'style',        label: '5. Style' },
  { id: 'export',       label: '6. Export' },
] as const;

function App() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Header ─────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Needle & thread icon */}
            <svg className="w-8 h-8 text-primary-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 26 L26 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22 L22 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
              <circle cx="26" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="26" cy="6" r="1" fill="currentColor"/>
              <path d="M6 26 Q0 30 4 32 Q8 30 6 26Z" fill="currentColor"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                Tailor<span className="text-primary-600">Craft</span>
              </h1>
              <p className="text-xs text-slate-500">Dynamic Jacket Pattern Generator</p>
            </div>
          </div>

          {/* Step tabs */}
          <nav aria-label="Application steps">
            <ol className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden text-sm">
              {STEPS.map(({ id, label }) => {
                const isActive = activeView === id;
                // Allow navigation to any step once the user has left the measurement form
                const isDisabled =
                  id !== 'measurements' && activeView === 'measurements';
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setActiveView(id)}
                      className={[
                        'px-4 py-2 font-medium transition-colors border-r border-slate-200 last:border-r-0',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                        isActive
                          ? 'bg-primary-600 text-white'
                          : isDisabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'hover:bg-slate-100 text-slate-600',
                      ].join(' ')}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </header>

      {/* ── Main content ───────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'measurements' && (
          <section aria-labelledby="measurements-heading">
            <h2 id="measurements-heading" className="sr-only">
              Enter body measurements
            </h2>
            <MeasurementPanel />
          </section>
        )}

        {activeView === 'mannequin' && (
          <section aria-labelledby="mannequin-heading">
            <h2 id="mannequin-heading" className="sr-only">3D Mannequin Preview</h2>
            <MannequinViewer />
          </section>
        )}

        {activeView === 'pattern' && (
          <section aria-labelledby="pattern-heading">
            <h2 id="pattern-heading" className="sr-only">Pattern Pieces</h2>
            <PatternCanvas />
          </section>
        )}

        {activeView === 'report' && (
          <section aria-labelledby="report-heading">
            <h2 id="report-heading" className="sr-only">Measurement Adjustment Report</h2>
            <AdjustmentPanel />
          </section>
        )}

        {activeView === 'style' && (
          <section aria-labelledby="style-heading">
            <h2 id="style-heading" className="sr-only">Style Customisation</h2>
            <StylePanel />
          </section>
        )}

        {activeView === 'export' && (
          <section aria-labelledby="export-heading">
            <h2 id="export-heading" className="sr-only">Export &amp; Print</h2>
            <ExportPanel />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
