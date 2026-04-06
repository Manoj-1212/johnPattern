// ─────────────────────────────────────────────
//  StyleSummary — displays all chosen options
//  in a compact read-only card.
// ─────────────────────────────────────────────

import { useAppStore } from '../../store/appStore';

const COL_LABELS: Record<string, string> = {
  notched_lapel: 'Notched Lapel', peak_lapel: 'Peak Lapel',
  shawl_collar: 'Shawl Collar', mandarin_collar: 'Mandarin',
  chinese_collar: 'Chinese', nehru_collar: 'Nehru',
  band_collar: 'Band', no_collar: 'No Collar',
};

const BTN_LABELS: Record<string, string> = {
  single_breasted_1btn: 'SB 1-btn', single_breasted_2btn: 'SB 2-btn',
  single_breasted_3btn: 'SB 3-btn', double_breasted_4btn: 'DB 4-btn',
  double_breasted_6btn: 'DB 6-btn', hidden_placket: 'Hidden placket',
};

const PKT_LABELS: Record<string, string> = {
  no_pocket: 'None', welt_pocket: 'Welt',
  double_welt_pocket: 'Jetted', flap_pocket: 'Flap',
  patch_pocket: 'Patch', ticket_pocket: 'Ticket',
};

const SLV_LABELS: Record<string, string> = {
  two_piece_sleeve: '2-piece', one_piece_sleeve: '1-piece', raglan_sleeve: 'Raglan',
};

const CUFF_LABELS: Record<string, string> = {
  functioning_buttons: 'Working buttons', decorative_buttons: 'Decorative buttons',
  plain_hem: 'Plain hem', turnback_cuff: 'Turnback cuff',
};

const VENT_LABELS: Record<string, string> = {
  no_vent: 'No vent', center_vent: 'Centre vent', side_vents: 'Side vents',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-50 last:border-b-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

export default function StyleSummary() {
  const o = useAppStore((s) => s.styleOptions);

  const lapelDesc = o.lapelStyle === 'none'
    ? 'None'
    : `${o.lapelStyle.charAt(0).toUpperCase() + o.lapelStyle.slice(1)}, ${o.lapelWidth}`;

  const liningDesc = o.liningConfig.fullyLined
    ? 'Full lining'
    : o.liningConfig.halfLined
    ? 'Half lining'
    : 'Unlined';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-800">Style Summary</h3>
      </div>

      <div className="space-y-0">
        <Row label="Collar"      value={COL_LABELS[o.collarType]  ?? o.collarType} />
        <Row label="Lapel"       value={lapelDesc} />
        <Row label="Buttons"     value={`${BTN_LABELS[o.buttonConfig.style] ?? o.buttonConfig.style} · ${o.buttonConfig.buttonSize}mm`} />
        <Row label="Chest pkt"   value={PKT_LABELS[o.pocketConfig.chestPocket] ?? o.pocketConfig.chestPocket} />
        <Row label="Side pkts"   value={`${PKT_LABELS[o.pocketConfig.sidePockets] ?? o.pocketConfig.sidePockets}${o.pocketConfig.includeTicketPocket ? ' + ticket' : ''}`} />
        <Row label="Sleeve"      value={SLV_LABELS[o.sleeveStyle] ?? o.sleeveStyle} />
        <Row label="Cuff"        value={`${CUFF_LABELS[o.cuffConfig.style] ?? o.cuffConfig.style} (×${o.cuffConfig.buttonCount})`} />
        <Row label="Back vent"   value={VENT_LABELS[o.backVent]   ?? o.backVent} />
        <Row label="Back seam"   value={o.backSeam.replace(/_/g, ' ')} />
        <Row label="Lining"      value={liningDesc} />
      </div>

      {/* Lining colour swatch */}
      {!o.liningConfig.noLining && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
          <div
            className="w-5 h-5 rounded-full border border-slate-200"
            style={{ backgroundColor: o.liningConfig.liningColor }}
          />
          <span className="text-xs text-slate-500">Lining colour</span>
          <span className="text-xs font-mono text-slate-600">{o.liningConfig.liningColor}</span>
        </div>
      )}
    </div>
  );
}
