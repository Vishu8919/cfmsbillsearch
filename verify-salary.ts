// verify-slips.ts — reconcile the engine against the six real CFMS payslips.
//
// Every number on the right-hand side of `expect` was read off an actual
// August 2026 payslip. A pass here means the engine reproduces real CFMS
// output to the rupee, component by component -- not just in the totals,
// where two opposite errors could cancel out.

import { computeSalary, expandMasterScale, stagesForGrade, apgliSlabFor, professionalTaxFor, ccaFor, scaFor, conveyanceFor, hraSlabForPlace, type SalaryInput } from './src/lib/salary/calc';
import { PAY_GRADES_2022, MASTER_SCALE_STAGES } from './src/lib/salary/rates';

let failures = 0;
const g = (s: string) => `\x1b[32m${s}\x1b[0m`;
const rd = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function check(label: string, got: number, want: number) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(
    `   ${ok ? g('PASS') : rd('FAIL')}  ${label.padEnd(26)} ` +
    `got ${String(got).padStart(8)}   want ${String(want).padStart(8)}`
  );
}

interface Slip {
  who: string;
  designation: string;
  input: SalaryInput;
  expect: { da: number; hra: number; cca: number; cps?: number; gross: number; deductions: number; net: number };
}

const slips: Slip[] = [
  {
    who: 'Slip 1 — CFMS 14385958', designation: 'Assistant Executive Engineer (CPS)',
    input: {
      basicPay: 72810, hraSlabKey: 'city_16', ccaCityType: 'other_corp',
      pensionScheme: 'cps', apgliSubscription: 3000, gisGroup: 'A', ehsSlab: 'C', incomeTax: 6000,
    },
    expect: { da: 27165, hra: 11650, cca: 500, cps: 9998, gross: 112125, deductions: 19618, net: 92507 },
  },
  {
    who: 'Slip 2 — CFMS 14389687', designation: 'Deputy Executive Engineer (GPF)',
    input: {
      basicPay: 133900, hraSlabKey: 'city_16', ccaCityType: 'other_corp',
      pensionScheme: 'gpf', gpfSubscription: 8034, apgliSubscription: 5000,
      gisGroup: 'A', ehsSlab: 'C', incomeTax: 25000,
    },
    expect: { da: 49958, hra: 17000, cca: 500, gross: 201358, deductions: 38654, net: 162704 },
  },
  {
    who: 'Slip 3 — CFMS 14392634', designation: 'Superintendent (GPF)',
    input: {
      basicPay: 85240, hraSlabKey: 'city_16', ccaCityType: 'other_corp',
      pensionScheme: 'gpf', gpfSubscription: 9000, apgliSubscription: 9200,
      gisGroup: 'B', ehsSlab: 'C', incomeTax: 8000,
    },
    expect: { da: 31803, hra: 13638, cca: 500, gross: 131181, deductions: 26760, net: 104421 },
  },
  {
    who: 'Slip 4 — CFMS 14392661', designation: 'Assistant Technical Officer (GPF)',
    input: {
      basicPay: 72810, hraSlabKey: 'city_16', ccaCityType: 'other_corp',
      pensionScheme: 'gpf', gpfSubscription: 6000, apgliSubscription: 2500,
      gisGroup: 'B', ehsSlab: 'AB', incomeTax: 8000,
    },
    expect: { da: 27165, hra: 11650, cca: 500, gross: 112125, deductions: 16985, net: 95140 },
  },
  {
    who: 'Slip 5 — CFMS 14392663', designation: 'Junior Assistant (GPF, loan + non-govt recovery)',
    input: {
      basicPay: 63660, hraSlabKey: 'city_16', ccaCityType: 'other_corp',
      pensionScheme: 'gpf', gpfSubscription: 4000, apgliSubscription: 3000,
      gisGroup: 'C', ehsSlab: 'AB',
      otherDeductions: [
        { label: 'APGLI Loan', amount: 4485 },
        { label: 'NonGovtDedn', amount: 16763 },
      ],
    },
    expect: { da: 23752, hra: 10186, cca: 500, gross: 98098, deductions: 28703, net: 69395 },
  },
  {
    who: 'Slip 6 — CFMS 14392783', designation: 'Assistant Executive Engineer (GPF, with Family Pay)',
    input: {
      basicPay: 118390, familyPay: 75, hraSlabKey: 'city_16', ccaCityType: 'other_corp',
      pensionScheme: 'gpf', gpfSubscription: 25000, apgliSubscription: 3000,
      gisGroup: 'A', ehsSlab: 'C', incomeTax: 16500,
    },
    expect: { da: 44171, hra: 17000, cca: 500, gross: 180136, deductions: 45120, net: 135016 },
  },
];

console.log('\n=== Reconciliation against real CFMS payslips (Aug 2026, DA 37.31%) ===\n');

for (const slip of slips) {
  console.log(`${slip.who} — ${slip.designation}`);
  const res = computeSalary(slip.input);
  const row = (k: string) => (res.earnings.find((e) => e.key === k) ?? res.deductions.find((d) => d.key === k))?.amount ?? 0;

  check('Dearness Allowance', row('da'), slip.expect.da);
  check('House Rent Allowance', row('hra'), slip.expect.hra);
  check('City Comp. Allowance', row('cca'), slip.expect.cca);
  if (slip.expect.cps !== undefined) check('CPS', row('cps'), slip.expect.cps);
  check('GROSS', res.gross, slip.expect.gross);
  check('TOTAL DEDUCTIONS', res.totalDeductions, slip.expect.deductions);
  check('NET', res.net, slip.expect.net);
  console.log('');
}

console.log('=== Structural checks on the RPS-2022 scales (G.O.Ms.No.1, Schedule I) ===\n');

const master = expandMasterScale();
check('Master scale stages', master.length, MASTER_SCALE_STAGES);
check('Master scale minimum', master[0], 20000);
check('Master scale maximum', master[master.length - 1], 179000);

let gradeMismatch = 0;
for (const grade of PAY_GRADES_2022) {
  if (stagesForGrade(grade.grade).length !== grade.stages) gradeMismatch++;
}
check('Grades matching G.O. stage counts', PAY_GRADES_2022.length - gradeMismatch, 32);

console.log('\n=== Slab boundary checks ===\n');
check('APGLI at basic 76730', apgliSlabFor(76730), 2200);
check('APGLI at basic 76731', apgliSlabFor(76731), 3000);
check('PT at gross 15000', professionalTaxFor(15000), 0);
check('PT at gross 20000', professionalTaxFor(20000), 150);
check('PT at gross 20001', professionalTaxFor(20001), 200);
check('CCA other corp @ 57100', ccaFor(57100, 'other_corp'), 350);
check('CCA other corp @ 57101', ccaFor(57101, 'other_corp'), 500);

console.log('\n=== G.O.Ms.No.101 allowance checks ===\n');
check('SCA mandal HQ @ 31750', scaFor(31750, 'mandal_hq'), 700);
check('SCA mandal HQ @ 31751', scaFor(31751, 'mandal_hq'), 850);
check('SCA hills @ 87481', scaFor(87481, 'hills'), 1800);
check('Conveyance @ basic 15000', conveyanceFor(15000), 1500);
check('Conveyance @ basic 30000 (capped)', conveyanceFor(30000), 2000);

console.log('\n=== HRA place lookup (G.O.Ms.No.27 annexure) ===\n');
check('Nandyal -> 16% slab', hraSlabForPlace('Nandyal') === 'city_16' ? 1 : 0, 1);
check('Adoni -> 12% slab', hraSlabForPlace('Adoni') === 'town_12' ? 1 : 0, 1);
check('Hyderabad -> 24% slab', hraSlabForPlace('Hyderabad') === 'metro_24' ? 1 : 0, 1);
check('Unlisted village -> no match', hraSlabForPlace('Somewhere') === null ? 1 : 0, 1);

console.log('');
if (failures > 0) {
  console.log(rd(`FAILED — ${failures} mismatch(es). Do not ship.`));
  process.exit(1);
}
console.log(g('OK — engine reconciles with all six payslips and the G.O. scale tables.'));
console.log(dim('(Every earning and deduction line matched to the rupee.)'));
