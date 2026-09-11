// src/lib/salary/rates.ts
//
// THE ONLY PLACE GOVERNMENT-CONTROLLED NUMBERS LIVE.
//
// Every rate below carries the G.O. that ordered it, the date it took effect,
// and a source URL. When a new G.O. lands, this file is the only edit: calc.ts
// reads rates, never hardcodes them, and the UI renders `source` straight into
// the "Calculation details" panel. If a number here has no G.O. next to it,
// that is deliberate and it is marked `verified: false` -- see UNVERIFIED at
// the bottom of this file.
//
// Amounts are RUPEES (not paise). Salary components are whole rupees in CFMS,
// and the rounding rule derived from real payslips is half-up -- see calc.ts.

'use strict';

export interface RateSource {
  /** G.O. citation as it should be shown to a user. */
  go: string;
  /** ISO date the rate takes effect (not the date the G.O. was signed). */
  effectiveFrom: string;
  /** Where this was read from. */
  url?: string;
  /** False = derived from payslips/secondary sources, G.O. not yet confirmed. */
  verified: boolean;
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEARNESS ALLOWANCE
//
// DA is a percentage of Basic Pay only. It is NOT computed on Family Pay --
// confirmed against a payslip carrying Basic 118390 + Family Pay 75, where DA
// was 44171 = 37.31% of 118390, not of 118465.
//
// `current` is the last rate backed by a G.O. The two entries in ANNOUNCED_DA
// have been publicised but no G.O. number could be confirmed, so they are
// offered as one-tap options rather than used as the default.
// ─────────────────────────────────────────────────────────────────────────────

export interface DaRate {
  rate: number;
  source: RateSource;
  status: 'current' | 'historical' | 'announced';
}

export const DA_RATES: DaRate[] = [
  {
    rate: 37.31,
    status: 'current',
    source: {
      go: 'G.O.Ms.No.60, Finance (HR.VI-PC&TA) Dept., dt. 20-10-2025',
      effectiveFrom: '2024-01-01',
      url: 'https://www.aputf.org/wp-content/uploads/2025/10/2025FIN_MS60_E.pdf',
      verified: true,
      note: 'Raised DA from 33.67% to 37.31% of basic pay (+3.64%).',
    },
  },
  {
    rate: 33.67,
    status: 'historical',
    source: {
      go: 'Finance (PC-TA) Dept. — DA w.e.f. 01-07-2023',
      effectiveFrom: '2023-07-01',
      verified: false,
      note: 'Cited as the preceding rate in G.O.Ms.No.60; its own G.O. number not confirmed.',
    },
  },
  {
    rate: 30.03,
    status: 'historical',
    source: {
      go: 'Finance (PC-TA) Dept. — DA w.e.f. 01-01-2023',
      effectiveFrom: '2023-01-01',
      verified: false,
    },
  },
  {
    rate: 26.39,
    status: 'historical',
    source: {
      go: 'G.O.Ms.No.113, Finance (PC-TA) Dept., dt. 21-10-2022',
      effectiveFrom: '2022-07-01',
      verified: false,
    },
  },
  {
    rate: 22.75,
    status: 'historical',
    source: {
      go: 'G.O.Ms.No.66, Finance (PC-TA) Dept.',
      effectiveFrom: '2022-01-01',
      verified: false,
    },
  },
  {
    rate: 20.02,
    status: 'historical',
    source: {
      go: 'G.O.Ms.No.1, Finance (PC-TA) Dept., dt. 17-01-2022, para 7.2',
      effectiveFrom: '2021-07-01',
      verified: true,
      note: 'Cumulative DA of 20.02% w.e.f. 01-07-2021, the base of the RPS-2022 series.',
    },
  },
];

/**
 * Rates announced in public reporting but with no G.O. number confirmed at the
 * time of writing. Shown in the UI as selectable pills labelled "announced",
 * never as the default. Move an entry into DA_RATES with status 'current' the
 * day its G.O. is published.
 */
export const ANNOUNCED_DA: DaRate[] = [
  {
    rate: 40.04,
    status: 'announced',
    source: {
      go: 'G.O. not confirmed',
      effectiveFrom: '2024-07-01',
      verified: false,
      note: 'First instalment (+2.73%) of the announced 4.55% enhancement.',
    },
  },
  {
    rate: 41.86,
    status: 'announced',
    source: {
      go: 'G.O. not confirmed',
      effectiveFrom: '2025-01-01',
      verified: false,
      note: 'Second instalment (+1.82%). Reported as payable with October 2026 salaries.',
    },
  },
];

/**
 * How AP DA is arrived at, from para 7.1 of G.O.Ms.No.1: state DA moves
 * 0.91% for every 1% of Central DA, with effect from 01-01-2019. This is why
 * the pending enhancement arrives as 2.73% and 1.82% instalments rather than
 * round numbers -- they are 0.91 x 3 and 0.91 x 2 of Central DA instalments.
 * Not used in arithmetic; shown to users who ask where the odd figures come
 * from, and a check on any future rate added above.
 */
export const DA_REGULATION: RateSource = {
  go: 'G.O.Ms.No.1, Finance (PC-TA) Dept., dt. 17-01-2022, para 7',
  effectiveFrom: '2019-01-01',
  verified: true,
  note: 'State DA = 0.91% for every 1% of Central DA. DA of 30.392% as on 01-07-2018 was merged into pay at the 23% fitment, so the RPS-2022 series restarts from 2.73% (01-01-2019) and reached 20.02% w.e.f. 01-07-2021.',
};

export const CURRENT_DA = DA_RATES.find((d) => d.status === 'current')!;

// ─────────────────────────────────────────────────────────────────────────────
// HOUSE RENT ALLOWANCE
//
// Percentage of Basic Pay, subject to a per-slab monetary ceiling. The ceiling
// bites early: at 16% anyone above Basic 106,250 is capped at 17,000, which is
// two of the six payslips used to validate this engine.
// ─────────────────────────────────────────────────────────────────────────────

export interface HraSlab {
  key: string;
  rate: number;
  ceiling: number;
  /** How the slab is described in the G.O. */
  populationBand: string;
  /** Places named in the G.O.'s annexure, for the location picker. */
  places: string[];
}

export const HRA_SOURCE: RateSource = {
  go: 'G.O.Ms.No.27, Finance (PC-TA) Dept., dt. 20-02-2022',
  effectiveFrom: '2022-01-01',
  verified: true,
  note: 'Revised HRA to 24% / 16% / 12% / 10% with ceilings of ₹25,000 / ₹17,000 / ₹13,000 / ₹11,000, in supersession of para 8 of G.O.Ms.No.1. Classification uses 2011 census population.',
};

/**
 * Para 8.2 of G.O.Ms.No.1 had said HRA would rise from 24/16/8% to 27/17.5/9%
 * once DA exceeded 50% of basic pay. G.O.Ms.No.27 supersedes para 8 in full
 * and carries no such clause, so on the face of the orders there is no
 * escalation. Recorded because DA is at 37.31% and the question will be asked.
 */
export const HRA_ESCALATION_NOTE: RateSource = {
  go: 'G.O.Ms.No.1, Finance (PC-TA) Dept., dt. 17-01-2022, para 8.2 — superseded by G.O.Ms.No.27',
  effectiveFrom: '2022-01-01',
  verified: false,
  note: 'The pre-2022 rule raising HRA when DA crosses 50% of basic pay does not appear in G.O.Ms.No.27. Treated as not in force.',
};

export const HRA_SLABS: HraSlab[] = [
  {
    key: 'metro_24',
    rate: 24,
    ceiling: 25000,
    populationBand: 'Above 50 lakh',
    places: ['Andhra Pradesh Bhavan, New Delhi', 'Other Government of A.P. offices in New Delhi', 'Hyderabad'],
  },
  {
    key: 'city_16',
    rate: 16,
    ceiling: 17000,
    populationBand: '2 lakh – 50 lakh (includes all 13 former district headquarters)',
    places: [
      'Ananthapur', 'Eluru', 'Greater Visakhapatnam Municipal Corporation', 'Guntur',
      'Kadapa', 'Kakinada', 'Kurnool', 'Nandyal', 'Nellore', 'Ongole', 'Proddatur',
      'Rajahmundry', 'Tirupathi', 'Vijayawada', 'Vizianagaram', 'Srikakulam',
      'Machilipatnam', 'Chittoor',
    ],
  },
  {
    key: 'town_12',
    rate: 12,
    ceiling: 13000,
    populationBand: '50,000 – 2 lakh',
    // The 54 entries named in the annexure to G.O.Ms.No.27, in the G.O.'s own
    // order. Transcribed in full so the location picker can name a user's town
    // instead of asking them to know their slab.
    places: [
      'Palasa', 'Kasibugga', 'Parvathipuram', 'Bobbili', 'Tuni', 'Samalkot',
      'Pithapuram', 'Mandapet', 'Amalapuram', 'Tadepalligudem', 'Tanuku',
      'Bhimavaram', 'Narasapur', 'Palakole', 'Jaggaiahpet', 'Nuzvid', 'Gudivada',
      'Macherla', 'Piduguralla', 'Tadepalle', 'Mangalagiri', 'Sattenapalle',
      'Vinukonda', 'Narasaraopet', 'Chilakaluripet', 'Tenali', 'Ponnur',
      'Bapatla', 'Repalle', 'Markapur', 'Chirala', 'Kandukur', 'Kavali',
      'Gudur', 'Venkatagiri', 'Badvel', 'Jammalamadugu', 'Pulivendla',
      'Rayachoti', 'Rajampet', 'Yemmiganur', 'Adoni', 'Dhone', 'Rayadurg',
      'Guntakal', 'Tadipatri', 'Dharmavaram', 'Kadiri', 'Hindupur',
      'Srikalahasti', 'Madanapalli', 'Nagari', 'Puttur', 'Punganur', 'Palamaner',
    ],
  },
  {
    key: 'other_10',
    rate: 10,
    ceiling: 11000,
    populationBand: 'Below 50,000 (all other places)',
    places: ['All other places / rural'],
  },
];

/**
 * Flat, searchable place -> slab index built from HRA_SLABS. The UI types
 * against this so a user picks "Nandyal" rather than working out that Nandyal
 * is in the 16% band. Places within 8 km of a listed town draw that town's
 * rate under a District Collector notification (para 8 of G.O.Ms.No.27), which
 * is why the picker also keeps a plain "somewhere else" option.
 */
export const HRA_PLACES: { place: string; slabKey: string }[] = HRA_SLABS.flatMap((s) =>
  s.places.map((place) => ({ place, slabKey: s.key })),
);

// ─────────────────────────────────────────────────────────────────────────────
// CITY COMPENSATORY ALLOWANCE
//
// Flat rupee amount from a matrix of (city class × pay range). Pay here means
// pay as defined in FR 9(21)(a)(i), i.e. basic pay.
// ─────────────────────────────────────────────────────────────────────────────

export type CcaCityType = 'hod' | 'gvmc_vja' | 'other_corp' | 'none';

export const CCA_SOURCE: RateSource = {
  go: 'G.O.Ms.No.29, Finance (PC-TA) Dept., dt. 20-02-2022',
  effectiveFrom: '2022-01-01',
  verified: true,
  note: 'Restored CCA, which para 9 of G.O.Ms.No.1 had discontinued.',
};

export const CCA_CITY_TYPES: { key: CcaCityType; label: string; short: string }[] = [
  { key: 'hod', label: 'Secretariat / Heads of Department offices', short: 'Secretariat / HoD' },
  { key: 'gvmc_vja', label: 'Greater Visakhapatnam or Vijayawada Municipal Corporation', short: 'GVMC / Vijayawada' },
  { key: 'other_corp', label: 'Other Municipal Corporations (11)', short: 'Other Corporations' },
  { key: 'none', label: 'Not in a CCA-eligible city', short: 'Not eligible' },
];

/** Upper bound of each pay band, and the amount per city type. */
export const CCA_MATRIX: { upto: number | null; hod: number; gvmc_vja: number; other_corp: number; none: number }[] = [
  { upto: 25220, hod: 400, gvmc_vja: 250, other_corp: 200, none: 0 },
  { upto: 44570, hod: 600, gvmc_vja: 350, other_corp: 300, none: 0 },
  { upto: 57100, hod: 700, gvmc_vja: 450, other_corp: 350, none: 0 },
  { upto: null, hod: 1000, gvmc_vja: 700, other_corp: 500, none: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// INTERIM RELIEF
//
// IR was paid ahead of RPS-2022 and then recovered against pay/DA arrears, so
// there is no IRA component in a current salary. Kept as an explicit zero
// rather than omitted, because employees ask about it and a row reading 0 with
// a G.O. beside it answers the question better than a missing row.
// ─────────────────────────────────────────────────────────────────────────────

export const IRA_RATE = 0;
export const IRA_SOURCE: RateSource = {
  go: 'G.O.Ms.No.103, Finance (PC-TA) Dept., dt. 11-05-2022',
  effectiveFrom: '2022-05-11',
  verified: true,
  note: 'Interim Relief is recovered against RPS-2022 pay and DA arrears; no IR is payable as a current salary component.',
};

// ─────────────────────────────────────────────────────────────────────────────
// CPS (Contributory Pension Scheme) — employees who joined on or after
// 01-09-2004. 10% of (Basic Pay + DA), with a matching 14% from Government.
// Confirmed arithmetically: Basic 72810 + DA 27165 = 99975, and the payslip
// deducts 9998 (99975 × 10% = 9997.5, rounded up).
// ─────────────────────────────────────────────────────────────────────────────

export const CPS_EMPLOYEE_RATE = 10;
export const CPS_GOVERNMENT_RATE = 14;
export const CPS_SOURCE: RateSource = {
  go: 'G.O.Ms.No.653, Finance (Pen.I) Dept., dt. 22-09-2004 (CPS introduction); employer share raised to 14% w.e.f. 01-04-2019',
  effectiveFrom: '2004-09-01',
  verified: false,
  note: 'Employee share of 10% of (Basic + DA) is confirmed against payslips. The G.O. citation itself still needs checking.',
};

// ─────────────────────────────────────────────────────────────────────────────
// APGLI — compulsory monthly premium by pay slab. This is a FLOOR, not a fixed
// amount: all six validation payslips subscribe above their slab minimum
// (e.g. Basic 85240 → slab 3000, actual deduction 9200). The calculator
// therefore defaults to the slab and lets the user override upward.
// ─────────────────────────────────────────────────────────────────────────────

export const APGLI_SOURCE: RateSource = {
  go: 'G.O.Ms.No.198, Finance (HR.V-PC.II) Dept.',
  effectiveFrom: '2022-11-01',
  verified: true,
  note: 'Compulsory premium slabs revised for RPS-2022 pay ranges w.e.f. the salary of November 2022.',
};

export const APGLI_SLABS: { from: number; upto: number | null; premium: number }[] = [
  { from: 20000, upto: 25220, premium: 800 },
  { from: 25221, upto: 32670, premium: 1000 },
  { from: 32671, upto: 44570, premium: 1300 },
  { from: 44571, upto: 54060, premium: 1800 },
  { from: 54061, upto: 76730, premium: 2200 },
  { from: 76731, upto: null, premium: 3000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// GIS (Group Insurance Scheme) — by GROUP OF POST, not by pay.
//
// This is the one deduction the payslips prove cannot be pay-driven: an
// Assistant Executive Engineer and an Assistant Technical Officer both on
// Basic 72,810 are deducted 120 and 60 respectively. So the user must pick
// their group; the calculator must not guess it from basic pay.
// ─────────────────────────────────────────────────────────────────────────────

export type GisGroup = 'A' | 'B' | 'C' | 'D';

export const GIS_SOURCE: RateSource = {
  go: 'A.P. State Employees Group Insurance Scheme — RPS-2022 slab rates',
  effectiveFrom: '2022-01-01',
  verified: false,
  note: 'Amounts (120/60/30/15) are confirmed against payslips for Groups A, B and C. The G.O. number and the exact group-to-post mapping still need the official order.',
};

export const GIS_RATES: { group: GisGroup; amount: number; label: string }[] = [
  { group: 'A', amount: 120, label: 'Group A' },
  { group: 'B', amount: 60, label: 'Group B' },
  { group: 'C', amount: 30, label: 'Group C' },
  { group: 'D', amount: 15, label: 'Group D' },
];

// ─────────────────────────────────────────────────────────────────────────────
// EHS (Employees Health Scheme) — two amounts, by pay GRADE of the post.
// Slab A (grades I–IV) and Slab B (grades V–XVII) pay 225; Slab C
// (grades XVIII–XXXII) pays 300. Confirmed by payslips on both sides of the
// boundary.
// ─────────────────────────────────────────────────────────────────────────────

export type EhsSlab = 'AB' | 'C';

export const EHS_SOURCE: RateSource = {
  go: 'G.O.Ms.No.54, HM&FW (M2) Dept., dt. 06-05-2020 (base scheme: G.O.Ms.No.174, HM&FW (M2) Dept., dt. 01-11-2013)',
  effectiveFrom: '2019-12-01',
  verified: true,
  note: 'Employee contribution enhanced from ₹90/₹120 to ₹225/₹300, applied from the salary of December 2019.',
};

export const EHS_RATES: { slab: EhsSlab; amount: number; label: string }[] = [
  { slab: 'AB', amount: 225, label: 'Slab A / B — pay grades I to XVII' },
  { slab: 'C', amount: 300, label: 'Slab C — pay grades XVIII to XXXII' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL TAX — slab on monthly salary. Charged on gross, and the ₹200
// band is confirmed by every validation payslip.
// ─────────────────────────────────────────────────────────────────────────────

export const PT_SOURCE: RateSource = {
  go: 'A.P. Tax on Professions, Trades, Callings and Employments Act, 1987',
  effectiveFrom: '1987-01-01',
  verified: true,
  note: 'Nil up to ₹15,000; ₹150 from ₹15,001 to ₹20,000; ₹200 above ₹20,000.',
};

export const PT_SLABS: { upto: number | null; amount: number }[] = [
  { upto: 15000, amount: 0 },
  { upto: 20000, amount: 150 },
  { upto: null, amount: 200 },
];

// ─────────────────────────────────────────────────────────────────────────────
// RPS 2022 PAY SCALES — Schedule I to the Notification under G.O.Ms.No.1.
//
// Only the master scale string and each grade's (min, max) are stored. Every
// grade is a SEGMENT of the master scale, so the stages of any grade are the
// master-scale stages between its min and max. Storing 32 expanded arrays
// would be ~1,100 numbers to keep in sync; storing two numbers per grade
// cannot drift. `expandMasterScale()` in calc.ts reproduces the stage counts
// printed in the G.O. for all 32 grades exactly, which is the check that this
// compression is lossless.
// ─────────────────────────────────────────────────────────────────────────────

export const PAY_SCALES_SOURCE: RateSource = {
  go: 'G.O.Ms.No.1, Finance (PC-TA) Dept., dt. 17-01-2022 — Schedule I',
  effectiveFrom: '2018-07-01',
  url: 'https://s3.ap-south-1.amazonaws.com/apfinance.gov.in/uploads/index-docs/Pay_Scales_RPS_2022_Cir.Memo.pdf',
  verified: true,
  note: 'RPS-2022 master scale and its 32 grades. Fitment 23%; effective from 01-07-2018.',
};

export const MASTER_SCALE_2022 =
  '20000-600-21800-660-23780-720-25940-780-28280-850-30830-920-33590-990-' +
  '36560-1080-39800-1170-43310-1260-47090-1350-51140-1460-55520-1580-60260-' +
  '1700-65360-1830-70850-1960-76730-2090-83000-2240-89720-2390-96890-2540-' +
  '104510-2700-112610-2890-121280-3100-130580-3320-140540-3610-154980-3900-' +
  '170580-4210-179000';

/** Stage count as printed in the G.O., used as a self-check, not for display. */
export const MASTER_SCALE_STAGES = 83;

export interface PayGrade {
  grade: number;
  min: number;
  max: number;
  /** Stage count printed in column (4) of Schedule I. */
  stages: number;
}

export const PAY_GRADES_2022: PayGrade[] = [
  { grade: 1, min: 20000, max: 61960, stages: 41 },
  { grade: 2, min: 20600, max: 63660, stages: 41 },
  { grade: 3, min: 21200, max: 65360, stages: 41 },
  { grade: 4, min: 22460, max: 72810, stages: 43 },
  { grade: 5, min: 23120, max: 74770, stages: 43 },
  { grade: 6, min: 23780, max: 76730, stages: 43 },
  { grade: 7, min: 25220, max: 80910, stages: 43 },
  { grade: 8, min: 27500, max: 87480, stages: 43 },
  { grade: 9, min: 28280, max: 89720, stages: 43 },
  { grade: 10, min: 29980, max: 94500, stages: 43 },
  { grade: 11, min: 32670, max: 101970, stages: 43 },
  { grade: 12, min: 34580, max: 107210, stages: 43 },
  { grade: 13, min: 35570, max: 109910, stages: 43 },
  { grade: 14, min: 37640, max: 115500, stages: 43 },
  { grade: 15, min: 38720, max: 118390, stages: 43 },
  { grade: 16, min: 40970, max: 124380, stages: 43 },
  { grade: 17, min: 44570, max: 127480, stages: 41 },
  { grade: 18, min: 45830, max: 130580, stages: 41 },
  { grade: 19, min: 48440, max: 137220, stages: 41 },
  { grade: 20, min: 54060, max: 140540, stages: 38 },
  { grade: 21, min: 57100, max: 147760, stages: 38 },
  { grade: 22, min: 61960, max: 151370, stages: 36 },
  { grade: 23, min: 65360, max: 154980, stages: 35 },
  { grade: 24, min: 70850, max: 158880, stages: 33 },
  { grade: 25, min: 76730, max: 162780, stages: 31 },
  { grade: 26, min: 80910, max: 166680, stages: 30 },
  { grade: 27, min: 87480, max: 170580, stages: 28 },
  { grade: 28, min: 94500, max: 170580, stages: 25 },
  { grade: 29, min: 101970, max: 174790, stages: 23 },
  { grade: 30, min: 112610, max: 174790, stages: 19 },
  { grade: 31, min: 124380, max: 179000, stages: 16 },
  { grade: 32, min: 133900, max: 179000, stages: 13 },
];

/**
 * EHS slab implied by pay grade. Grades I–XVII → 225, XVIII–XXXII → 300.
 * Offered as a default when the user picks a grade; always overridable,
 * because EHS follows the grade of the POST, and a user who enters a basic pay
 * without picking a grade has not told us their post.
 */
export function ehsSlabForGrade(grade: number): EhsSlab {
  return grade >= 18 ? 'C' : 'AB';
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGNATION INCREMENTS
//
// Five increments beyond the maximum of the time scale, treated as regular
// increments for pay fixation, AAS and pension. What the G.O. does NOT state
// is the RATE at which they accrue past the maximum, so the pay-stage picker
// stops at the top of each grade and says so rather than inventing stages.
// ─────────────────────────────────────────────────────────────────────────────

export const STAGNATION_INCREMENT_COUNT = 5;
export const STAGNATION_SOURCE: RateSource = {
  go: 'G.O.Ms.No.100, Finance (PC-TA) Dept., dt. 11-05-2022 (Rule 7-A)',
  effectiveFrom: '2022-05-11',
  verified: true,
  note: 'Five stagnation increments allowed beyond the time scale, treated as regular increments. The rate of increment beyond the maximum is not specified in the order.',
};

// ─────────────────────────────────────────────────────────────────────────────
// OTHER ALLOWANCES — G.O.Ms.No.101
//
// None of these is universal, so none is ever added automatically. They are
// offered as named options with their rule attached, which is the difference
// between "enter your conveyance allowance" and "your conveyance allowance is
// 10% of basic capped at ₹2,000, and here is the order that says so".
// ─────────────────────────────────────────────────────────────────────────────

export const OTHER_ALLOWANCES_SOURCE: RateSource = {
  go: 'G.O.Ms.No.101, Finance (PC-TA) Dept., dt. 11-05-2022',
  effectiveFrom: '2022-06-01',
  verified: true,
  note: 'Revised rates of other allowances under the 11th PRC.',
};

/** Differently abled employees: 10% of basic pay, ceiling ₹2,000 (para 12.1). */
export const CONVEYANCE_DIFFERENTLY_ABLED = { rate: 10, ceiling: 2000 };

export type ScaAreaType = 'mandal_hq' | 'sub_mandal_hq' | 'hills';

export const SCA_AREA_TYPES: { key: ScaAreaType; label: string }[] = [
  { key: 'mandal_hq', label: 'Mandal Headquarters' },
  { key: 'sub_mandal_hq', label: 'Sub-Mandal Headquarters' },
  { key: 'hills', label: 'Hills / Hilltops' },
];

/** Special Compensatory Allowance by basic pay band (para 9.1). */
export const SCA_MATRIX: { upto: number | null; mandal_hq: number; sub_mandal_hq: number; hills: number }[] = [
  { upto: 31750, mandal_hq: 700, sub_mandal_hq: 800, hills: 900 },
  { upto: 42140, mandal_hq: 850, sub_mandal_hq: 975, hills: 1100 },
  { upto: 54060, mandal_hq: 1000, sub_mandal_hq: 1150, hills: 1300 },
  { upto: 65360, mandal_hq: 1225, sub_mandal_hq: 1400, hills: 1600 },
  { upto: 87480, mandal_hq: 1330, sub_mandal_hq: 1525, hills: 1700 },
  { upto: null, mandal_hq: 1375, sub_mandal_hq: 1600, hills: 1800 },
];

/** Readers Allowance for blind employees, per month (para 13.1). */
export const READERS_ALLOWANCE: { key: string; label: string; amount: number }[] = [
  { key: 'sgt', label: 'Secondary Grade Teacher', amount: 800 },
  { key: 'sa', label: 'School Assistant', amount: 1000 },
  { key: 'jl', label: 'Junior Lecturer and above', amount: 1200 },
];

/**
 * Allowances that exist in G.O.Ms.No.101 but are post-, department- or
 * duty-specific, so the calculator names them and takes the user's figure
 * rather than deriving one: Risk Allowance (a per-post table across a dozen
 * departments), Ration Allowance, Uniform Allowance (annual, paid with March
 * salary), Fixed Travelling Allowance (depends on days toured and
 * jurisdiction) and Special Pay.
 */
export const USER_ENTERED_ALLOWANCES = [
  'Risk Allowance', 'Ration Allowance', 'Uniform Allowance', 'Fixed Travelling Allowance', 'Special Pay',
];

// ─────────────────────────────────────────────────────────────────────────────
// THINGS THIS FILE DOES NOT KNOW
//
// Surfaced in the UI rather than hidden, so a user is never shown a confident
// number that rests on a guess.
// ─────────────────────────────────────────────────────────────────────────────

export const UNVERIFIED_ITEMS: { item: string; whatIsNeeded: string }[] = [
  {
    item: 'GIS group-to-post mapping and G.O.',
    whatIsNeeded:
      'The A.P. GIS order for RPS-2022. Amounts 120/60/30/15 are confirmed from payslips; which posts fall in which group is not.',
  },
  {
    item: 'Stagnation increment rate',
    whatIsNeeded:
      'G.O.Ms.No.100 allows five increments beyond the maximum of the scale but does not state the rate. Until that is confirmed, the pay-stage picker stops at the maximum of each grade; type the figure in directly if you are drawing stagnation increments.',
  },
  {
    item: 'GPF minimum subscription rule',
    whatIsNeeded:
      'The A.P. GPF Rules provision on minimum monthly subscription. Until then GPF is a pure user input with no suggested default.',
  },
  {
    item: 'Part-month proration',
    whatIsNeeded:
      'A payslip with Paid Days below the full month, to establish which components are prorated and on what divisor. All six validation slips are full-month.',
  },
  {
    item: 'CPS treatment of Family Pay',
    whatIsNeeded:
      'A payslip for a CPS employee who also draws Family Pay, to confirm whether the 10% base includes it. Currently Basic + DA only.',
  },
];
