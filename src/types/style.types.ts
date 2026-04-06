// ─────────────────────────────────────────────
//  Garment Style Option Types
// ─────────────────────────────────────────────

export type CollarType =
  | 'notched_lapel'
  | 'peak_lapel'
  | 'shawl_collar'
  | 'mandarin_collar'
  | 'chinese_collar'
  | 'nehru_collar'
  | 'band_collar'
  | 'no_collar';

export type LapelStyle = 'notched' | 'peak' | 'shawl' | 'none';

export type LapelWidth = 'narrow' | 'medium' | 'wide';

export type ButtonStyle =
  | 'single_breasted_1btn'
  | 'single_breasted_2btn'
  | 'single_breasted_3btn'
  | 'double_breasted_4btn'
  | 'double_breasted_6btn'
  | 'hidden_placket';

export interface ButtonConfig {
  style: ButtonStyle;
  buttonCount: number;
  buttonSize: number; // mm
  buttonholeType: 'horizontal' | 'vertical';
}

export type PocketType =
  | 'no_pocket'
  | 'welt_pocket'
  | 'double_welt_pocket'
  | 'flap_pocket'
  | 'patch_pocket'
  | 'ticket_pocket';

export interface PocketConfig {
  chestPocket: PocketType;
  sidePockets: PocketType;
  includeTicketPocket: boolean;
  pocketWidth: number; // cm
  pocketPosition: number; // cm from waist seam
}

export type SleeveStyle =
  | 'two_piece_sleeve'
  | 'one_piece_sleeve'
  | 'raglan_sleeve';

export type CuffStyle =
  | 'functioning_buttons'
  | 'decorative_buttons'
  | 'plain_hem'
  | 'turnback_cuff';

export interface CuffConfig {
  style: CuffStyle;
  buttonCount: 1 | 2 | 3 | 4;
}

export type BackVent = 'no_vent' | 'center_vent' | 'side_vents';

export type BackSeam = 'no_seam' | 'center_seam' | 'princess_seam';

export interface LiningConfig {
  fullyLined: boolean;
  halfLined: boolean;
  noLining: boolean;
  liningColor: string;
}

export interface JacketStyleOptions {
  collarType: CollarType;
  lapelStyle: LapelStyle;
  lapelWidth: LapelWidth;
  buttonConfig: ButtonConfig;
  pocketConfig: PocketConfig;
  sleeveStyle: SleeveStyle;
  cuffConfig: CuffConfig;
  backVent: BackVent;
  backSeam: BackSeam;
  liningConfig: LiningConfig;
}
