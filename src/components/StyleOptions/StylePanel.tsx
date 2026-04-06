// ─────────────────────────────────────────────
//  StylePanel — Module 4 main view
//  Accordion sidebar + style summary card.
//  Left: accordion with all 7 style sections.
//  Right: style summary + mini pattern preview tag.
// ─────────────────────────────────────────────

import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import CollarSelector  from './CollarSelector';
import LapelSelector   from './LapelSelector';
import ButtonSelector  from './ButtonSelector';
import PocketSelector  from './PocketSelector';
import SleeveSelector  from './SleeveSelector';
import BackSelector    from './BackSelector';
import LiningSelector  from './LiningSelector';
import StyleSummary    from './StyleSummary';

// ─────────────────────────────────────────────
//  Accordion section definitions
// ─────────────────────────────────────────────

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

// Simple section icon SVGs
function SectionIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const COLLAR_ICON  = 'M4,6 C4,3 16,3 16,6 L16,10 C16,14 10,16 10,16 C10,16 4,14 4,10Z';
const LAPEL_ICON   = 'M10,4 L5,12 L8,14 L10,10 L12,14 L15,12Z';
const BUTTON_ICON  = 'M10,4 A2,2 0 1,1 10,4.01 M10,10 A2,2 0 1,1 10,10.01 M10,16 A2,2 0 1,1 10,16.01';
const POCKET_ICON  = 'M4,8 L16,8 L16,16 Q10,18 4,16Z';
const SLEEVE_ICON  = 'M4,4 L8,16 L12,16 L16,4 M4,4 C6,2 8,2 10,3 C12,2 14,2 16,4';
const BACK_ICON    = 'M4,4 L4,16 L16,16 L16,4 M10,10 L10,16';
const LINING_ICON  = 'M4,4 L16,4 L16,16 L4,16Z M6,6 L14,6 L14,14 L6,14Z';

// ─────────────────────────────────────────────
//  Accordion Section component
// ─────────────────────────────────────────────

function AccordionItem({
  section,
  isOpen,
  onToggle,
}: {
  section: AccordionSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={[
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          isOpen
            ? 'bg-primary-50 text-primary-800'
            : 'bg-white text-slate-700 hover:bg-slate-50',
        ].join(' ')}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2.5 font-medium text-sm">
          <span className={isOpen ? 'text-primary-600' : 'text-slate-400'}>
            {section.icon}
          </span>
          {section.title}
        </span>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 py-4 bg-white border-t border-slate-100">
          {section.content}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  StylePanel main component
// ─────────────────────────────────────────────

export default function StylePanel() {
  const setActiveView = useAppStore((s) => s.setActiveView);

  // Track which accordion section is open
  const [openSection, setOpenSection] = useState<string>('collar');

  const toggle = (id: string) =>
    setOpenSection((prev) => (prev === id ? '' : id));

  const sections: AccordionSection[] = [
    {
      id: 'collar',
      title: 'Collar',
      icon: <SectionIcon d={COLLAR_ICON} />,
      content: <CollarSelector />,
    },
    {
      id: 'lapel',
      title: 'Lapel',
      icon: <SectionIcon d={LAPEL_ICON} />,
      content: <LapelSelector />,
    },
    {
      id: 'buttons',
      title: 'Buttons',
      icon: <SectionIcon d={BUTTON_ICON} />,
      content: <ButtonSelector />,
    },
    {
      id: 'pockets',
      title: 'Pockets',
      icon: <SectionIcon d={POCKET_ICON} />,
      content: <PocketSelector />,
    },
    {
      id: 'sleeves',
      title: 'Sleeves & Cuff',
      icon: <SectionIcon d={SLEEVE_ICON} />,
      content: <SleeveSelector />,
    },
    {
      id: 'back',
      title: 'Back Style',
      icon: <SectionIcon d={BACK_ICON} />,
      content: <BackSelector />,
    },
    {
      id: 'lining',
      title: 'Lining',
      icon: <SectionIcon d={LINING_ICON} />,
      content: <LiningSelector />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page toolbar ────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('report')}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ← Pattern
          </button>
          <h2 className="text-lg font-semibold text-slate-800">Style Customisation</h2>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('export')}
          className="px-4 py-1.5 rounded bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Export →
        </button>
      </div>

      {/* ── Two-column layout ───────────────── */}
      <div className="flex gap-6 items-start">
        {/* Left: accordion */}
        <div className="flex-1 space-y-2 min-w-0">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              section={section}
              isOpen={openSection === section.id}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>

        {/* Right: summary + tip */}
        <aside className="w-72 shrink-0 space-y-4">
          <StyleSummary />

          {/* Tip card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800 mb-1">💡 Style affects pattern</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Collar and back vent choices update the corresponding pattern pieces.
              Double-breasted buttons add an overlap to the front panel.
            </p>
          </div>

          {/* Navigation hint */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Next steps</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveView('report')}
                className="w-full text-left text-xs text-slate-600 hover:text-primary-700 flex items-center gap-2 transition-colors"
              >
                <span className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                View adjustment report
              </button>
              <button
                type="button"
                onClick={() => setActiveView('export')}
                className="w-full text-left text-xs text-slate-600 hover:text-primary-700 flex items-center gap-2 transition-colors"
              >
                <span className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
                Export to PDF / SVG
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
