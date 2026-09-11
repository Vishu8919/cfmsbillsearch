// src/lib/salary/calc.ts
//
// The salary engine. Pure: no React, no DOM, no fetch, no Date.now(). Give it
// an input object, get rows back. That is what makes it testable against real
// payslips (see verify-slips), and it is the reason every rate lives in
// rates.ts rather than in here.
//
// ── Two rules worth stating up front, both derived from real payslips ──
//
// 1. ROUNDING IS HALF-UP, PER COMPONENT. Not truncation, and not applied to
//    the total. Two slips settle it: HRA on Basic 63660 is 10185.6 and the
//    slip shows 10186; CPS on 99975 is 9997.5 and the slip shows 9998. Both
//    would be a rupee lower under Math.floor.
//
// 2. DA AND HRA ARE COMPUTED ON BASIC PAY ALONE. Family Pay is an earning but
//    not a base. A slip with Basic 118390 + Family Pay 75 shows DA 44171,
//    which is 37.31% of 118390 -- on 118465 it would have been 44199.
//
// Every row carries `basis`, which is the distinction the whole page is built
// around: 'rule' means a G.O. decided this number and the user cannot argue
// with it; 'user' means the user typed it and we are only adding it up.

'use strict';

import {
  APGLI_SLABS,
  CONVEYANCE_DIFFERENTLY_ABLED,
  HRA_PLACES,
  OTHER_ALLOWANCES_SOURCE,
  READERS_ALLOWANCE,
  SCA_MATRIX,
  APGLI_SOURCE,
  CCA_MATRIX,
  CCA_SOURCE,
  CPS_EMPLOYEE_RATE,
  CPS_SOURCE,
  CURRENT_DA,
  DA_RATES,
  ANNOUNCED_DA,
  EHS_RATES,
  EHS_SOURCE,
  GIS_RATES,
  GIS_SOURCE,
  HRA_SLABS,
  HRA_SOURCE,
  IRA_RATE,
  IRA_SOURCE,
  MASTER_SCALE_2022,
  PAY_GRADES_2022,
  PAY_SCALES_SOURCE,
  PT_SLABS,
  PT_SOURCE,
  type CcaCityType,
  type EhsSlab,
  type ScaAreaType,
  type GisGroup,
  type RateSource,
} from './rates';

// ── Public types ────────────────────────────────────────────────────────────

export type PensionScheme = 'cps' | 'gpf' | 'none';

export interface LineItem {
  label: string;
  amount: number;
}

export interface SalaryInput {
  basicPay: number;

  /** Percent. Defaults to the current G.O. rate. */
  daRate?: number;

  /** Either pick a city slab, or pass an explicit rate/ceiling override. */
  hraSlabKey?: string | null;
  hraRate?: number | null;
  hraCeiling?: number | null;

  /** Either pick a CCA city type, or pass an explicit amount. */
  ccaCityType?: CcaCityType | null;
  ccaAmount?: number | null;

  /** Percent. Zero under current orders; exposed so a future IR is a data edit. */
  iraRate?: number;

  familyPay?: number;

  /** Rule-based allowances from G.O.Ms.No.101 — each off unless asked for. */
  conveyanceDifferentlyAbled?: boolean;
  scaAreaType?: ScaAreaType | null;
  readersAllowanceKey?: string | null;

  otherEarnings?: LineItem[];

  pensionScheme?: PensionScheme;
  /** CPS is computed. GPF is whatever the employee subscribes. */
  gpfSubscription?: number;

  /** Defaults to the compulsory slab premium; override upward for voluntary. */
  apgliSubscription?: number | null;

  gisGroup?: GisGroup | null;
  gisAmount?: number | null;

  ehsSlab?: EhsSlab | null;
  ehsAmount?: number | null;

  /** Defaults to the slab on gross. */
  professionalTax?: number | null;

  incomeTax?: number;
  otherDeductions?: LineItem[];
}

export interface ResultRow {
  key: string;
  label: string;
  amount: number;
  /** 'rule' = set by a Government Order. 'user' = entered by the person. */
  basis: 'rule' | 'user';
  /** How a 'rule' row was arrived at, in words. */
  workings?: string;
  source?: RateSource;
}

export interface SalaryResult {
  earnings: ResultRow[];
  deductions: ResultRow[];
  gross: number;
  totalDeductions: number;
  net: number;
  /** Rates actually used, for the "Calculation details" panel. */
  applied: {
    daRate: number;
    daSource?: RateSource;
    hraRate: number;
    hraCeiling: number | null;
    hraCapped: boolean;
    iraRate: number;
  };
  /** Anything the user should know about this particular calculation. */
  notes: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Half-up to the rupee. See rule 1 at the top of this file. */
export function r(n: number): number {
  return Math.round(n);
}

function num(n: number | null | undefined, fallback = 0): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

/**
 * Expand a scale spec ("20000-600-21800-660-...") into its stages.
 * Throws if a segment does not land exactly on its stated bound, which is the
 * cheap way to catch a mistyped digit in rates.ts.
 */
export function expandScale(spec: string): number[] {
  const parts = spec.split('-').map((s) => Number(s.trim()));
  if (parts.some((n) => !Number.isFinite(n))) throw new Error('Bad scale spec');
  const stages: number[] = [parts[0]];
  let cur = parts[0];
  for (let i = 1; i < parts.length; i += 2) {
    const step = parts[i];
    const bound = parts[i + 1];
    if (!Number.isFinite(step) || !Number.isFinite(bound)) throw new Error('Bad scale spec');
    while (cur < bound) {
      cur += step;
      stages.push(cur);
    }
    if (cur !== bound) throw new Error(`Scale segment overshot: ${cur} != ${bound}`);
  }
  return stages;
}

export function expandMasterScale(): number[] {
  return expandScale(MASTER_SCALE_2022);
}

/** The pay stages of one RPS-2022 grade: the master-scale stages it spans. */
export function stagesForGrade(grade: number): number[] {
  const g = PAY_GRADES_2022.find((x) => x.grade === grade);
  if (!g) return [];
  const master = expandMasterScale();
  const i = master.indexOf(g.min);
  const j = master.indexOf(g.max);
  if (i < 0 || j < 0) return [];
  return master.slice(i, j + 1);
}

export function gradesForBasicPay(basicPay: number): number[] {
  return PAY_GRADES_2022.filter((g) => basicPay >= g.min && basicPay <= g.max).map((g) => g.grade);
}

export function apgliSlabFor(basicPay: number): number {
  const slab = APGLI_SLABS.find((s) => basicPay >= s.from && (s.upto === null || basicPay <= s.upto));
  return slab ? slab.premium : 0;
}

export function ccaFor(basicPay: number, cityType: CcaCityType): number {
  const band = CCA_MATRIX.find((b) => b.upto === null || basicPay <= b.upto);
  return band ? band[cityType] : 0;
}

/** Special Compensatory Allowance: flat amount by basic pay band and area. */
export function scaFor(basicPay: number, area: ScaAreaType): number {
  const band = SCA_MATRIX.find((b) => b.upto === null || basicPay <= b.upto);
  return band ? band[area] : 0;
}

/** Conveyance allowance for differently abled employees: 10% of basic, capped. */
export function conveyanceFor(basicPay: number): number {
  return Math.min(r((basicPay * CONVEYANCE_DIFFERENTLY_ABLED.rate) / 100), CONVEYANCE_DIFFERENTLY_ABLED.ceiling);
}

/** Which HRA slab a named place falls in, for the location picker. */
export function hraSlabForPlace(place: string): string | null {
  const hit = HRA_PLACES.find((p) => p.place.toLowerCase() === place.trim().toLowerCase());
  return hit ? hit.slabKey : null;
}

export function professionalTaxFor(monthlySalary: number): number {
  const slab = PT_SLABS.find((s) => s.upto === null || monthlySalary <= s.upto);
  return slab ? slab.amount : 0;
}

/** Every DA option the UI offers: G.O.-backed first, announced ones after. */
export function daOptions() {
  return { current: CURRENT_DA, historical: DA_RATES.filter((d) => d.status === 'historical'), announced: ANNOUNCED_DA };
}

// ── The engine ──────────────────────────────────────────────────────────────

export function computeSalary(input: SalaryInput): SalaryResult {
  const notes: string[] = [];
  const basic = num(input.basicPay);

  if (basic <= 0) {
    return {
      earnings: [], deductions: [], gross: 0, totalDeductions: 0, net: 0,
      applied: { daRate: 0, hraRate: 0, hraCeiling: null, hraCapped: false, iraRate: 0 },
      notes: ['Enter a basic pay to calculate.'],
    };
  }

  // ── Earnings ─────────────────────────────────────────────────────────────

  const daRate = num(input.daRate, CURRENT_DA.rate);
  const daSource = [CURRENT_DA, ...DA_RATES, ...ANNOUNCED_DA].find((d) => d.rate === daRate)?.source;
  const da = r((basic * daRate) / 100);

  const slab = input.hraSlabKey ? HRA_SLABS.find((s) => s.key === input.hraSlabKey) : undefined;
  const hraRate = num(input.hraRate, slab ? slab.rate : 0);
  const hraCeiling = input.hraCeiling ?? (slab ? slab.ceiling : null);
  const hraUncapped = r((basic * hraRate) / 100);
  const hraCapped = hraCeiling !== null && hraUncapped > hraCeiling;
  const hra = hraCapped ? (hraCeiling as number) : hraUncapped;
  if (hraCapped) {
    notes.push(
      `HRA at ${hraRate}% of ₹${basic.toLocaleString('en-IN')} works out to ₹${hraUncapped.toLocaleString('en-IN')}, ` +
      `above the ₹${(hraCeiling as number).toLocaleString('en-IN')} ceiling for this slab, so the ceiling applies.`
    );
  }

  const cca = input.ccaAmount ?? (input.ccaCityType ? ccaFor(basic, input.ccaCityType) : 0);
  const iraRate = num(input.iraRate, IRA_RATE);
  const ira = r((basic * iraRate) / 100);
  const familyPay = num(input.familyPay);

  const earnings: ResultRow[] = [
    { key: 'basic', label: 'Basic Pay', amount: basic, basis: 'user' },
    {
      key: 'da', label: 'Dearness Allowance', amount: da, basis: 'rule',
      workings: `${daRate}% of basic pay`, source: daSource,
    },
    {
      key: 'hra', label: 'House Rent Allowance', amount: hra, basis: 'rule',
      workings: hraCapped
        ? `${hraRate}% of basic pay, capped at the ₹${(hraCeiling as number).toLocaleString('en-IN')} ceiling`
        : `${hraRate}% of basic pay`,
      source: HRA_SOURCE,
    },
    {
      key: 'cca', label: 'City Compensatory Allowance', amount: cca, basis: 'rule',
      workings: 'Flat rate by city class and pay range', source: CCA_SOURCE,
    },
    {
      key: 'ira', label: 'Interim Relief', amount: ira, basis: 'rule',
      workings: iraRate === 0 ? 'Not payable under current orders' : `${iraRate}% of basic pay`,
      source: IRA_SOURCE,
    },
  ];

  if (familyPay > 0) {
    // Placed after the rule-based allowances but before free-form earnings, to
    // mirror the CFMS payslip, where Family Pay sits directly under Basic Pay.
    earnings.splice(1, 0, { key: 'familyPay', label: 'Family Pay', amount: familyPay, basis: 'user' });
    notes.push('Family Pay is added to gross but is not part of the base for DA or HRA.');
  }

  if (input.conveyanceDifferentlyAbled) {
    const amount = conveyanceFor(basic);
    earnings.push({
      key: 'conveyance', label: 'Conveyance Allowance', amount, basis: 'rule',
      workings: `${CONVEYANCE_DIFFERENTLY_ABLED.rate}% of basic pay for differently abled employees, ceiling ₹${CONVEYANCE_DIFFERENTLY_ABLED.ceiling.toLocaleString('en-IN')}`,
      source: OTHER_ALLOWANCES_SOURCE,
    });
  }

  if (input.scaAreaType) {
    earnings.push({
      key: 'sca', label: 'Special Compensatory Allowance', amount: scaFor(basic, input.scaAreaType), basis: 'rule',
      workings: 'Flat rate by basic pay band and area classification',
      source: OTHER_ALLOWANCES_SOURCE,
    });
  }

  if (input.readersAllowanceKey) {
    const ra = READERS_ALLOWANCE.find((x) => x.key === input.readersAllowanceKey);
    if (ra) {
      earnings.push({
        key: 'readers', label: 'Readers Allowance', amount: ra.amount, basis: 'rule',
        workings: `Flat monthly rate for ${ra.label}`,
        source: OTHER_ALLOWANCES_SOURCE,
      });
    }
  }

  for (const [i, item] of (input.otherEarnings ?? []).entries()) {
    const amount = num(item.amount);
    if (amount !== 0) {
      earnings.push({ key: `other_earning_${i}`, label: item.label || 'Other allowance', amount, basis: 'user' });
    }
  }

  const gross = earnings.reduce((s, row) => s + row.amount, 0);

  // ── Deductions ───────────────────────────────────────────────────────────

  const deductions: ResultRow[] = [];
  const scheme: PensionScheme = input.pensionScheme ?? 'none';

  if (scheme === 'cps') {
    deductions.push({
      key: 'cps',
      label: 'CPS',
      amount: r(((basic + da) * CPS_EMPLOYEE_RATE) / 100),
      basis: 'rule',
      workings: `${CPS_EMPLOYEE_RATE}% of (basic pay + DA)`,
      source: CPS_SOURCE,
    });
  } else if (scheme === 'gpf') {
    const gpf = num(input.gpfSubscription);
    if (gpf > 0) {
      deductions.push({ key: 'gpf', label: 'GPF Subscription', amount: gpf, basis: 'user' });
    }
  }

  const pt = input.professionalTax ?? professionalTaxFor(gross);
  if (pt > 0) {
    deductions.push({
      key: 'pt', label: 'Professional Tax', amount: pt, basis: 'rule',
      workings: 'Slab on monthly salary', source: PT_SOURCE,
    });
  }

  const ehs = input.ehsAmount ?? (input.ehsSlab ? EHS_RATES.find((e) => e.slab === input.ehsSlab)?.amount ?? 0 : 0);
  if (ehs > 0) {
    deductions.push({
      key: 'ehs', label: 'EHS Subscription', amount: ehs, basis: 'rule',
      workings: 'Flat contribution by pay grade slab', source: EHS_SOURCE,
    });
  }

  const gis = input.gisAmount ?? (input.gisGroup ? GIS_RATES.find((g) => g.group === input.gisGroup)?.amount ?? 0 : 0);
  if (gis > 0) {
    deductions.push({
      key: 'gis', label: 'GIS Subscription', amount: gis, basis: 'rule',
      workings: 'Flat contribution by group of post', source: GIS_SOURCE,
    });
  }

  const apgli = input.apgliSubscription ?? apgliSlabFor(basic);
  if (apgli > 0) {
    const compulsory = apgliSlabFor(basic);
    const voluntary = apgli > compulsory;
    deductions.push({
      key: 'apgli',
      label: 'APGLI Subscription',
      amount: apgli,
      basis: voluntary ? 'user' : 'rule',
      workings: voluntary
        ? `Above the ₹${compulsory.toLocaleString('en-IN')} compulsory premium for this pay slab`
        : 'Compulsory premium for this pay slab',
      source: APGLI_SOURCE,
    });
  }

  const incomeTax = num(input.incomeTax);
  if (incomeTax > 0) {
    deductions.push({ key: 'incomeTax', label: 'Income Tax', amount: incomeTax, basis: 'user' });
  }

  for (const [i, item] of (input.otherDeductions ?? []).entries()) {
    const amount = num(item.amount);
    if (amount !== 0) {
      deductions.push({ key: `other_deduction_${i}`, label: item.label || 'Other recovery', amount, basis: 'user' });
    }
  }

  const totalDeductions = deductions.reduce((s, row) => s + row.amount, 0);

  return {
    earnings,
    deductions,
    gross,
    totalDeductions,
    net: gross - totalDeductions,
    applied: { daRate, daSource, hraRate, hraCeiling, hraCapped, iraRate },
    notes,
  };
}

export { PAY_GRADES_2022, PAY_SCALES_SOURCE, HRA_SLABS, GIS_RATES, EHS_RATES };
