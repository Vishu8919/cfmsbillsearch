// src/pages/salary-calculator.tsx
//
// AP Government Salary Calculator. Client-side only -- the site is a static
// export, so there is no API involved and nothing a user types here leaves
// their browser. That is worth saying out loud on the page: people are
// entering their own pay.
//
// ── The one idea the whole page is built around ──
//
// Some numbers are decided by a Government Order and some are decided by the
// employee. Mixing them produces a figure nobody can check. So every row in
// the result table is tagged: "G.O." rows carry the order that set them and
// cannot be edited; "Yours" rows are inputs we are only adding up. The
// Calculation details panel then lists the actual G.O. behind each rate.
//
// Two modes, because the two questions people ask are different sizes:
//   Normal   -- "my basic is 30000, what is my gross?" Rule-based only.
//   Advanced -- the full payslip, including GPF, income tax and recoveries.

import { useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FaCalculator, FaFilePdf, FaChevronDown, FaInfoCircle, FaLandmark, FaUserEdit, FaPlus, FaTimes,
} from 'react-icons/fa'
import {
  computeSalary, apgliSlabFor, stagesForGrade, hraSlabForPlace, scaFor, conveyanceFor, ccaFor,
  type SalaryInput, type ResultRow, type LineItem,
} from '../lib/salary/calc'
import {
  ANNOUNCED_DA, CCA_CITY_TYPES, CONVEYANCE_DIFFERENTLY_ABLED, CURRENT_DA,
  DA_REGULATION, EHS_RATES, GIS_RATES, HRA_SLABS, PAY_GRADES_2022,
  READERS_ALLOWANCE, SCA_AREA_TYPES, STAGNATION_SOURCE, UNVERIFIED_ITEMS,
  USER_ENTERED_ALLOWANCES, ehsSlabForGrade,
  type CcaCityType, type EhsSlab, type GisGroup, type RateSource, type ScaAreaType,
} from '../lib/salary/rates'

const inr = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Shared input styling. Extracted because there are a dozen of them and a
// single source keeps the form visually level.
// Native option popups are painted by the OS, not by Tailwind: they take the
// select's `color` but keep a white background, so `text-white` renders
// invisible text. Every option and optgroup carries its own dark surface.
const OPT = 'bg-[#171436] text-white'

const FIELD =
  'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm ' +
  'placeholder:text-indigo-200/30 focus:outline-none focus:border-indigo-400/50 transition-colors'
const LABEL = 'block text-xs font-medium text-indigo-200/70 mb-1.5'
const CARD = 'bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6'

export default function SalaryCalculator() {
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick')

  // ── Earnings inputs ──
  const [basicPay, setBasicPay] = useState('')
  const [daChoice, setDaChoice] = useState<string>(String(CURRENT_DA.rate))
  const [customDa, setCustomDa] = useState('')
  const [hraSlabKey, setHraSlabKey] = useState('city_16')
  const [hraPlace, setHraPlace] = useState('Kurnool')
  const [ccaCityType, setCcaCityType] = useState<CcaCityType>('other_corp')
  const [familyPay, setFamilyPay] = useState('')
  const [conveyance, setConveyance] = useState(false)
  const [scaArea, setScaArea] = useState<ScaAreaType | ''>('')
  const [readers, setReaders] = useState('')
  const [otherEarnings, setOtherEarnings] = useState<LineItem[]>([])

  // ── Deduction inputs ──
  const [pensionScheme, setPensionScheme] = useState<'cps' | 'gpf' | 'none'>('cps')
  const [gpf, setGpf] = useState('')
  const [apgliOverride, setApgliOverride] = useState('')
  const [gisGroup, setGisGroup] = useState<GisGroup | ''>('')
  const [ehsSlab, setEhsSlab] = useState<EhsSlab | ''>('')
  const [incomeTax, setIncomeTax] = useState('')
  const [otherDeductions, setOtherDeductions] = useState<LineItem[]>([])

  // ── Optional: pick basic pay off the RPS-2022 scale instead of typing it ──
  const [useScalePicker, setUseScalePicker] = useState(false)
  const [grade, setGrade] = useState('')
  const [showSources, setShowSources] = useState(false)

  const basic = Number(basicPay) || 0
  const daRate = daChoice === 'custom' ? Number(customDa) || 0 : Number(daChoice)

  const activeSlab = useMemo(() => HRA_SLABS.find((s) => s.key === hraSlabKey), [hraSlabKey])

  const stages = useMemo(() => (grade ? stagesForGrade(Number(grade)) : []), [grade])

  const input: SalaryInput = useMemo(() => {
    const quick = mode === 'quick'
    return {
      basicPay: basic,
      daRate,
      hraSlabKey,
      ccaCityType,
      familyPay: quick ? 0 : Number(familyPay) || 0,
      // GPF and income tax are now asked for in both modes.
      conveyanceDifferentlyAbled: quick ? false : conveyance,
      scaAreaType: quick ? null : scaArea || null,
      readersAllowanceKey: quick ? null : readers || null,
      otherEarnings: quick ? [] : otherEarnings,
      pensionScheme,
      gpfSubscription: Number(gpf) || 0,
      apgliSubscription: apgliOverride === '' ? null : Number(apgliOverride) || 0,
      gisGroup: gisGroup || null,
      ehsSlab: ehsSlab || null,
      incomeTax: Number(incomeTax) || 0,
      otherDeductions: quick ? [] : otherDeductions,
    }
  }, [
    mode, basic, daRate, hraSlabKey, ccaCityType, familyPay, conveyance, scaArea, readers, otherEarnings,
    pensionScheme, gpf, apgliOverride, gisGroup, ehsSlab, incomeTax, otherDeductions,
  ])

  const result = useMemo(() => computeSalary(input), [input])
  const hasResult = basic > 0

  // In Quick mode the gross is exact but the net cannot be, because GPF,
  // income tax and recoveries are personal figures. Saying which ones are
  // missing is the difference between an estimate and a wrong answer.
  const quickExclusions = useMemo(() => {
    const missing: string[] = []
    if (pensionScheme === 'gpf' && !Number(gpf)) missing.push('GPF subscription')
    if (!ehsSlab) missing.push('EHS')
    if (!gisGroup) missing.push('GIS')
    if (!Number(incomeTax)) missing.push('income tax')
    missing.push('loans and other recoveries')
    return missing
  }, [pensionScheme, gpf, ehsSlab, gisGroup, incomeTax])

  // Sources actually used in this calculation, de-duplicated by G.O. string.
  const appliedSources = useMemo(() => {
    const seen = new Map<string, RateSource>()
    for (const row of [...result.earnings, ...result.deductions]) {
      if (row.source && !seen.has(row.source.go)) seen.set(row.source.go, row.source)
    }
    return Array.from(seen.values())
  }, [result])

  // PDF laid out as the CFMS payslip is: a header block, then earnings and
  // deductions in facing columns, then gross against total deductions, then
  // net. Drawn cell by cell rather than with a table plugin, so jsPDF stays
  // the only dependency and it keeps loading on demand.
  async function downloadPdf() {
    const { jsPDF } = await import('jspdf')
    // Landscape: the payslip is two facing columns, and portrait squeezes
    // four columns of labels and amounts into 515pt. Landscape gives 762pt,
    // so a label like 'City Compensatory Allowance' sits in its cell at full
    // length instead of being shortened to fit.
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })

    // Column edges. Left pair mirrors the right pair, as on the payslip.
    const X0 = 40, X1 = 250, X2 = 421, X3 = 631, X4 = 802
    const ROW = 16
    let y = 46

    // Truncate to the cell rather than letting text run across the border.
    // Nothing in the current data needs it at landscape width, but a future
    // allowance with a long name would silently break the grid otherwise.
    const fit = (text: string, w: number) => {
      const room = w - 10
      if (!text || doc.getTextWidth(text) <= room) return text
      let cut = text
      while (cut.length > 1 && doc.getTextWidth(cut + '…') > room) cut = cut.slice(0, -1)
      return cut + '…'
    }
    const label = (text: string, x: number, w: number, yy: number, bold = false) => {
      doc.rect(x, yy, w, ROW)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(fit(text, w), x + 5, yy + 11)
    }
    const value = (text: string, x: number, w: number, yy: number, bold = false) => {
      doc.rect(x, yy, w, ROW)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(fit(text, w), x + w - 5, yy + 11, { align: 'right' })
    }

    // ── Title ──
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Andhra Pradesh Government Salary — Estimate', X0, y)
    y += 14
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110)
    doc.text('Revised Pay Scales 2022 · unofficial estimate · cfmsbillsstatus.online', X0, y)
    doc.setTextColor(0)
    y += 12

    // ── Header block ──
    doc.setFontSize(8.5)
    doc.setLineWidth(0.5)
    const period = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const headerRows: [string, string, string, string][] = [
      ['PAY PERIOD', period, 'PAID DAYS', 'Full month'],
      ['BASIC PAY', inr(basic), 'DA RATE', `${result.applied.daRate}%`],
      [
        'HRA SLAB',
        `${result.applied.hraRate}% · ${hraPlace}`,
        'HRA CEILING',
        result.applied.hraCeiling ? inr(result.applied.hraCeiling) : '—',
      ],
      [
        'CITY CLASS (CCA)',
        CCA_CITY_TYPES.find((c) => c.key === ccaCityType)?.short ?? '—',
        'PENSION SCHEME',
        pensionScheme === 'cps' ? 'CPS' : pensionScheme === 'gpf' ? 'GPF / OPS' : 'None',
      ],
    ]
    for (const [l1, v1, l2, v2] of headerRows) {
      label(l1, X0, X1 - X0, y, true)
      label(v1, X1, X2 - X1, y)
      label(l2, X2, X3 - X2, y, true)
      label(v2, X3, X4 - X3, y)
      y += ROW
    }
    y += 10

    // ── EARNINGS | DEDUCTIONS ──
    doc.setFontSize(9)
    doc.rect(X0, y, X2 - X0, ROW)
    doc.rect(X2, y, X4 - X2, ROW)
    doc.setFont('helvetica', 'bold')
    doc.text('EARNINGS', (X0 + X2) / 2, y + 10.8, { align: 'center' })
    doc.text('DEDUCTIONS', (X2 + X4) / 2, y + 10.8, { align: 'center' })
    y += ROW

    doc.setFontSize(8.5)
    const lines = Math.max(result.earnings.length, result.deductions.length)
    for (let i = 0; i < lines; i++) {
      const e = result.earnings[i]
      const d = result.deductions[i]
      // Suffix tells the reader which figures a G.O. fixed and which are theirs.
      const tag = (r2?: { basis: 'rule' | 'user' }) => (r2 ? (r2.basis === 'rule' ? '  [G.O.]' : '  [yours]') : '')
      label(e ? e.label + tag(e) : '', X0, X1 - X0, y)
      value(e ? inr(e.amount) : '', X1, X2 - X1, y)
      label(d ? d.label + tag(d) : '', X2, X3 - X2, y)
      value(d ? inr(d.amount) : '', X3, X4 - X3, y)
      y += ROW
    }

    // ── Totals, gross facing total deductions, then net ──
    doc.setFontSize(9)
    label('GROSS', X0, X1 - X0, y, true)
    value(inr(result.gross), X1, X2 - X1, y, true)
    label('DEDUCTIONS', X2, X3 - X2, y, true)
    value(inr(result.totalDeductions), X3, X4 - X3, y, true)
    y += ROW

    doc.rect(X0, y, X2 - X0, ROW)
    label('NET', X2, X3 - X2, y, true)
    value(inr(result.net), X3, X4 - X3, y, true)
    y += ROW + 18

    // ── Rates applied ──
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('RATES APPLIED', X0, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(105)
    for (const src of appliedSources) {
      y += 10
      doc.text(`• ${src.go} (w.e.f. ${src.effectiveFrom})`, X0 + 6, y, { maxWidth: X4 - X0 - 12 })
    }
    y += 16
    doc.text(
      'Not an official pay statement. Actual salary is whatever your DDO draws through CFMS.',
      X0, y,
    )

    doc.save('ap-salary-estimate.pdf')
  }

  return (
    <>
      <Head>
        <title>AP Government Salary Calculator 2026 | RPS 2022 Gross &amp; Net Salary</title>
        <meta
          name="description"
          content="Free Andhra Pradesh government employee salary calculator. Enter your basic pay to get gross and net salary with DA 37.31%, HRA, CCA, CPS, GPF, GIS, EHS, APGLI and Professional Tax as per RPS 2022 Government Orders."
        />
        <meta
          name="keywords"
          content="AP salary calculator, Andhra Pradesh government salary calculator, RPS 2022 salary, AP DA 37.31, AP HRA rates, CPS deduction calculator, AP gross salary calculator, AP net salary"
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/salary-calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AP Government Salary Calculator — RPS 2022" />
        <meta
          property="og:description"
          content="Calculate gross and net salary for Andhra Pradesh government employees under RPS 2022, with every rate traced to its Government Order."
        />
        <meta property="og:url" content="https://www.cfmsbillsstatus.online/salary-calculator" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AP Government Salary Calculator',
              url: 'https://www.cfmsbillsstatus.online/salary-calculator',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any',
              description:
                'Calculate gross and net monthly salary for Andhra Pradesh government employees under the Revised Pay Scales 2022.',
              inLanguage: 'en-IN',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
            }),
          }}
        />
      </Head>

      {/* Firefox and some Android builds ignore per-option classes; this rule
          catches them so a dropdown is never unreadable. */}
      <style jsx global>{`
        .salary-calc select option,
        .salary-calc select optgroup {
          background-color: #171436;
          color: #ffffff;
        }
      `}</style>

      <main
        className="salary-calc bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 relative"
        style={{ minHeight: '100dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-7 text-center">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-indigo-200/70">
              <FaLandmark className="w-3 h-3" />
              Revised Pay Scales 2022 · DA {CURRENT_DA.rate}%
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tight">
              AP Government Salary Calculator
            </h1>
            <p className="mt-3 text-indigo-200/60 text-sm max-w-2xl mx-auto leading-relaxed">
              Enter your basic pay to work out gross and net salary. Every rate comes from a
              Government Order, and each one is listed at the bottom of the page so you can check it.
            </p>
          </motion.div>

          {/* Mode switch */}
          <div className="flex justify-center mb-7">
            <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
              {([['quick', 'Normal'], ['advanced', 'Advanced']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={
                    'px-5 py-1.5 rounded-full text-[13px] transition-colors ' +
                    (mode === key ? 'bg-indigo-500/25 text-white' : 'text-indigo-200/60 hover:text-white')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-5">

            {/* ── Inputs ─────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-5"
            >
              <div className={CARD}>
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FaCalculator className="w-3.5 h-3.5 text-indigo-300" />
                  Your pay
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-indigo-200/70">Basic Pay (₹)</label>
                      <button
                        onClick={() => setUseScalePicker((v) => !v)}
                        className="text-[11px] text-indigo-300 hover:text-white transition-colors"
                      >
                        {useScalePicker ? 'Type it instead' : 'Pick from pay scale'}
                      </button>
                    </div>

                    {useScalePicker ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select value={grade} onChange={(e) => {
                          setGrade(e.target.value)
                          setBasicPay('')
                          if (e.target.value) setEhsSlab(ehsSlabForGrade(Number(e.target.value)))
                        }} className={FIELD}>
                          <option value="" className={OPT}>Grade…</option>
                          {PAY_GRADES_2022.map((g) => (
                            <option key={g.grade} value={g.grade} className={OPT}>
                              Grade {g.grade} · {inr(g.min)}–{inr(g.max)}
                            </option>
                          ))}
                        </select>
                        <select
                          value={basicPay}
                          onChange={(e) => setBasicPay(e.target.value)}
                          className={FIELD}
                          disabled={!grade}
                        >
                          <option value="" className={OPT}>Stage…</option>
                          {stages.map((s) => (
                            <option key={s} value={s} className={OPT}>{inr(s)}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <input
                        type="number"
                        inputMode="numeric"
                        value={basicPay}
                        onChange={(e) => setBasicPay(e.target.value)}
                        placeholder="e.g. 30000"
                        className={FIELD}
                      />
                    )}
                  </div>

                  {/* DA — floating, so the current G.O. rate is the default and
                      anything else is an explicit choice. */}
                  <div>
                    <label className={LABEL}>Dearness Allowance</label>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill
                        active={daChoice === String(CURRENT_DA.rate)}
                        onClick={() => setDaChoice(String(CURRENT_DA.rate))}
                        label={`${CURRENT_DA.rate}%`}
                        sub="current"
                      />
                      {ANNOUNCED_DA.map((d) => (
                        <Pill
                          key={d.rate}
                          active={daChoice === String(d.rate)}
                          onClick={() => setDaChoice(String(d.rate))}
                          label={`${d.rate}%`}
                          sub="announced"
                        />
                      ))}
                      <Pill
                        active={daChoice === 'custom'}
                        onClick={() => setDaChoice('custom')}
                        label="Other"
                      />
                    </div>
                    {daChoice === 'custom' && (
                      <input
                        type="number"
                        value={customDa}
                        onChange={(e) => setCustomDa(e.target.value)}
                        placeholder="DA rate %"
                        className={`${FIELD} mt-2`}
                      />
                    )}
                    {daChoice !== String(CURRENT_DA.rate) && daChoice !== 'custom' && (
                      <p className="mt-2 text-[11px] text-amber-200/70 leading-relaxed">
                        This rate has been announced but we could not confirm its G.O. Salaries are
                        still being paid at {CURRENT_DA.rate}%.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={LABEL}>Where you work (sets HRA)</label>
                    <select
                      value={hraPlace}
                      onChange={(e) => {
                        setHraPlace(e.target.value)
                        const key = hraSlabForPlace(e.target.value)
                        if (key) setHraSlabKey(key)
                        else setHraSlabKey('other_10')
                      }}
                      className={FIELD}
                    >
                      {HRA_SLABS.map((slab) => (
                        <optgroup key={slab.key} label={`${slab.rate}% — ceiling ₹${inr(slab.ceiling)}`} className={OPT}>
                          {slab.places.map((place) => (
                            <option key={place} value={place} className={OPT}>{place}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="mt-1.5 text-[11px] text-indigo-200/40 leading-relaxed">
                      {activeSlab?.rate}% of basic pay, ceiling ₹{inr(activeSlab?.ceiling ?? 0)} · {activeSlab?.populationBand}.
                      Places within 8 km of a listed town draw that town&apos;s rate.
                    </p>
                  </div>

                  <div>
                    <label className={LABEL}>City class (sets CCA)</label>
                    <select
                      value={ccaCityType}
                      onChange={(e) => setCcaCityType(e.target.value as CcaCityType)}
                      className={FIELD}
                    >
                      {CCA_CITY_TYPES.map((c) => (
                        <option key={c.key} value={c.key} className={OPT}>
                          {c.label}{basic > 0 ? ` · ₹${inr(ccaFor(basic, c.key))}` : ''}
                        </option>
                      ))}
                    </select>
                    {basic > 0 && (
                      <p className="mt-1.5 text-[11px] text-indigo-200/40">
                        ₹{inr(ccaFor(basic, ccaCityType))} at this pay — the band above ₹57,100
                        pays ₹1,000 in Secretariat/HoD offices, ₹700 in GVMC and Vijayawada,
                        ₹500 in the other 11 corporations.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={LABEL}>Pension scheme</label>
                    <div className="flex gap-1.5">
                      {([['cps', 'CPS'], ['gpf', 'GPF / OPS'], ['none', 'Neither']] as const).map(([k, l]) => (
                        <Pill key={k} active={pensionScheme === k} onClick={() => setPensionScheme(k)} label={l} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions that need the user's own figures */}
              <div className={CARD}>
                <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <FaUserEdit className="w-3.5 h-3.5 text-indigo-300" />
                  Your deductions
                </h2>
                <p className="text-[11px] text-indigo-200/40 mb-4 leading-relaxed">
                  These vary from person to person, so the calculator cannot work them out.
                  Leave anything blank and it is simply left out.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>GIS group</label>
                      <select
                        value={gisGroup}
                        onChange={(e) => setGisGroup(e.target.value as GisGroup | '')}
                        className={FIELD}
                      >
                        <option value="" className={OPT}>Not included</option>
                        {GIS_RATES.map((g) => (
                          <option key={g.group} value={g.group} className={OPT}>{g.label} · ₹{g.amount}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>EHS slab</label>
                      <select
                        value={ehsSlab}
                        onChange={(e) => setEhsSlab(e.target.value as EhsSlab | '')}
                        className={FIELD}
                      >
                        <option value="" className={OPT}>Not included</option>
                        {EHS_RATES.map((e2) => (
                          <option key={e2.slab} value={e2.slab} className={OPT}>₹{e2.amount} · {e2.slab === 'C' ? 'grades XVIII+' : 'grades I–XVII'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>
                      APGLI premium (₹)
                      {basic > 0 && (
                        <span className="text-indigo-300/60 font-normal"> · slab minimum ₹{inr(apgliSlabFor(basic))}</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={apgliOverride}
                      onChange={(e) => setApgliOverride(e.target.value)}
                      placeholder={basic > 0 ? String(apgliSlabFor(basic)) : 'Slab minimum'}
                      className={FIELD}
                    />
                    <p className="mt-1.5 text-[11px] text-indigo-200/40">
                      Most employees subscribe above the compulsory minimum. Enter your actual figure.
                    </p>
                  </div>

                  {pensionScheme === 'gpf' && (
                    <div>
                      <label className={LABEL}>GPF subscription (₹)</label>
                      <input
                        type="number" value={gpf} onChange={(e) => setGpf(e.target.value)}
                        placeholder="Your monthly subscription" className={FIELD}
                      />
                    </div>
                  )}

                  <div>
                    <label className={LABEL}>Income tax per month (₹)</label>
                    <input
                      type="number" value={incomeTax} onChange={(e) => setIncomeTax(e.target.value)}
                      placeholder="As deducted by your DDO" className={FIELD}
                    />
                  </div>

                  {mode === 'advanced' && (
                    <>
                      <div>
                        <label className={LABEL}>Family Pay (₹)</label>
                        <input
                          type="number" value={familyPay} onChange={(e) => setFamilyPay(e.target.value)}
                          placeholder="If applicable" className={FIELD}
                        />
                      </div>

                      <div className="pt-1 border-t border-white/[0.07]">
                        <p className="text-[11px] text-indigo-200/50 mb-3 leading-relaxed">
                          These three are set by G.O.Ms.No.101, so the calculator works out the amount
                          once you tell it they apply to you.
                        </p>

                        <label className="flex items-start gap-2.5 cursor-pointer mb-3">
                          <input
                            type="checkbox"
                            checked={conveyance}
                            onChange={(e) => setConveyance(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded accent-indigo-500 shrink-0"
                          />
                          <span className="text-[12px] text-indigo-100/80 leading-relaxed">
                            Conveyance Allowance for differently abled employees
                            <span className="block text-[11px] text-indigo-200/45">
                              {CONVEYANCE_DIFFERENTLY_ABLED.rate}% of basic pay, ceiling ₹{inr(CONVEYANCE_DIFFERENTLY_ABLED.ceiling)}
                              {basic > 0 && ` — ₹${inr(conveyanceFor(basic))} for you`}
                            </span>
                          </span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL}>Special Compensatory Allowance</label>
                            <select
                              value={scaArea}
                              onChange={(e) => setScaArea(e.target.value as ScaAreaType | '')}
                              className={FIELD}
                            >
                              <option value="" className={OPT}>Not applicable</option>
                              {SCA_AREA_TYPES.map((a) => (
                                <option key={a.key} value={a.key} className={OPT}>
                                  {a.label}{basic > 0 ? ` · ₹${inr(scaFor(basic, a.key))}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={LABEL}>Readers Allowance</label>
                            <select value={readers} onChange={(e) => setReaders(e.target.value)} className={FIELD}>
                              <option value="" className={OPT}>Not applicable</option>
                              {READERS_ALLOWANCE.map((ra) => (
                                <option key={ra.key} value={ra.key} className={OPT}>{ra.label} · ₹{inr(ra.amount)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <Repeater
                        title="Other allowances"
                        hint={`Anything G.O.Ms.No.101 leaves post- or duty-specific: ${USER_ENTERED_ALLOWANCES.join(', ')}.`}
                        items={otherEarnings}
                        onChange={setOtherEarnings}
                        placeholder="e.g. Conveyance Allowance"
                      />

                      <Repeater
                        title="Loans and other recoveries"
                        hint="APGLI loan, GPF loan, non-government deductions, festival advance."
                        items={otherDeductions}
                        onChange={setOtherDeductions}
                        placeholder="e.g. APGLI Loan"
                      />
                    </>
                  )}
                </div>
              </div>

              {mode === 'quick' && (
                <p className="text-[11px] text-indigo-200/40 leading-relaxed px-1">
                  Switch to <button onClick={() => setMode('advanced')} className="text-indigo-300 hover:text-white underline underline-offset-2">Advanced</button>{' '}
                  to add family pay, loans and recoveries, and the allowances set by G.O.Ms.No.101.
                </p>
              )}
            </motion.div>

            {/* ── Result ─────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="lg:col-span-3 space-y-5"
            >
              {!hasResult ? (
                <div className={`${CARD} flex flex-col items-center justify-center text-center py-16`}>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center mb-4">
                    <FaCalculator className="w-6 h-6 text-indigo-300" />
                  </div>
                  <p className="text-white font-semibold">Enter your basic pay</p>
                  <p className="text-indigo-200/60 text-sm mt-1.5 max-w-xs leading-relaxed">
                    Everything else has a sensible default, so you will see a figure straight away.
                  </p>
                </div>
              ) : (
                <>
                  {/* Payslip statement.
                      Two columns, the way the CFMS payslip itself is laid
                      out: earnings and gross on the left, deductions and net
                      on the right. Stacks on mobile, where side-by-side would
                      squeeze both. */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                      <h2 className="text-sm font-semibold text-white">Monthly salary statement</h2>
                      <button
                        onClick={downloadPdf}
                        className="inline-flex items-center gap-1.5 text-[12px] text-indigo-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        <FaFilePdf className="w-3 h-3" />
                        PDF
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 md:divide-x divide-white/10">
                      {/* Earnings */}
                      <div className="flex flex-col">
                        <Section title="Earnings" rows={result.earnings} />
                        <div className="mt-auto">
                          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-indigo-500/10 border-t border-indigo-400/20">
                            <span className="text-[13px] font-semibold text-white">Gross Salary</span>
                            <span className="text-[15px] font-bold text-indigo-100 tabular-nums">
                              ₹{inr(result.gross)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions, then net */}
                      <div className="flex flex-col border-t md:border-t-0 border-white/10">
                        <Section title="Deductions" rows={result.deductions} />
                        <div className="mt-auto">
                          <div className="flex items-center justify-between px-5 py-3 bg-white/[0.04] border-t border-white/10">
                            <span className="text-[13px] font-semibold text-white">Total Deductions</span>
                            <span className="text-[14px] font-semibold text-white tabular-nums">
                              ₹{inr(result.totalDeductions)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-500/10 border-t border-emerald-400/20">
                            <span className="text-[13px] font-semibold text-white">Net Salary</span>
                            <span className="text-[15px] font-bold text-emerald-200 tabular-nums">
                              ₹{inr(result.net)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Honesty about what the net does and does not include */}
                  {mode === 'quick' && (
                    <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl px-5 py-4">
                      <p className="text-[12px] text-indigo-100/80 leading-relaxed">
                        <strong className="text-white">Gross is exact. Net is partial.</strong>{' '}
                        This net leaves out {quickExclusions.join(', ')}. Add them in Advanced mode for a
                        figure you can compare against your payslip.
                      </p>
                    </div>
                  )}

                  {result.notes.length > 0 && (
                    <div className="space-y-2">
                      {result.notes.map((note, i) => (
                        <div key={i} className="flex gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <FaInfoCircle className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-indigo-100/75 leading-relaxed">{note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Calculation details / sources */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowSources((v) => !v)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="text-sm font-semibold text-white">Calculation details and sources</span>
                      <FaChevronDown className={`w-3 h-3 text-indigo-300 transition-transform ${showSources ? 'rotate-180' : ''}`} />
                    </button>

                    {showSources && (
                      <div className="px-5 pb-5 space-y-4">
                        <div className="space-y-3">
                          {appliedSources.map((s) => (
                            <div key={s.go} className="border-l-2 border-indigo-400/30 pl-3">
                              <p className="text-[12px] text-white leading-snug">{s.go}</p>
                              <p className="text-[11px] text-indigo-200/50 mt-0.5">
                                Effective from {s.effectiveFrom}
                                {!s.verified && ' · G.O. citation not yet confirmed'}
                              </p>
                              {s.note && (
                                <p className="text-[11px] text-indigo-200/60 mt-1 leading-relaxed">{s.note}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-white/10 space-y-3">
                          {[DA_REGULATION, STAGNATION_SOURCE].map((s2) => (
                            <div key={s2.go} className="border-l-2 border-white/10 pl-3">
                              <p className="text-[12px] text-indigo-100/70 leading-snug">{s2.go}</p>
                              {s2.note && (
                                <p className="text-[11px] text-indigo-200/50 mt-1 leading-relaxed">{s2.note}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-white/10">
                          <p className="text-[11px] font-semibold text-amber-200/80 mb-2">
                            What this calculator does not know
                          </p>
                          <ul className="space-y-1.5">
                            {UNVERIFIED_ITEMS.map((u) => (
                              <li key={u.item} className="text-[11px] text-indigo-200/55 leading-relaxed">
                                <span className="text-indigo-100/80">{u.item}</span> — {u.whatIsNeeded}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <p className="text-[11px] text-indigo-200/40 leading-relaxed text-center px-4">
                This is an unofficial estimate and not a pay statement. Your actual salary is whatever
                your DDO draws through CFMS. Nothing you enter here leaves your browser.
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap text-[12px] text-indigo-200/50">
                <Link href="/" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Bill Status Checker</Link>
                <span className="text-indigo-200/20">·</span>
                <Link href="/articles" className="hover:text-indigo-300 transition-colors underline underline-offset-2">CFMS Guides</Link>
                <span className="text-indigo-200/20">·</span>
                <Link href="/contact" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Report an error</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  )
}

// ── Small presentational pieces ─────────────────────────────────────────────

function Pill({ active, onClick, label, sub }: {
  active: boolean; onClick: () => void; label: string; sub?: string
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-3 py-1.5 rounded-full text-[12px] border transition-colors ' +
        (active
          ? 'bg-indigo-500/25 border-indigo-400/40 text-white'
          : 'bg-white/5 border-white/10 text-indigo-200/65 hover:text-white hover:border-white/20')
      }
    >
      {label}
      {sub && <span className="ml-1 text-[10px] opacity-60">{sub}</span>}
    </button>
  )
}

/** One block of the statement. `basis` is rendered as a badge, because a
 *  number the Government set and a number the user typed should not look
 *  alike. */
function Section({ title, rows }: { title: string; rows: ResultRow[] }) {
  return (
    <div>
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/60">{title}</span>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-2 px-4 sm:px-5 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] text-indigo-100/85">{row.label}</span>
                <span
                  className={
                    'text-[9px] px-1.5 py-0.5 rounded border ' +
                    (row.basis === 'rule'
                      ? 'bg-indigo-500/15 border-indigo-400/25 text-indigo-200/80'
                      : 'bg-white/5 border-white/10 text-indigo-200/50')
                  }
                  title={row.basis === 'rule' ? 'Set by a Government Order' : 'Entered by you'}
                >
                  {row.basis === 'rule' ? 'G.O.' : 'Yours'}
                </span>
              </div>
              {row.workings && (
                <p className="text-[11px] text-indigo-200/40 mt-0.5 leading-snug">{row.workings}</p>
              )}
            </div>
            <span className="text-[13px] text-white tabular-nums shrink-0">{inr(row.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Add-your-own rows for allowances and recoveries. Kept deliberately dumb:
 *  a label and an amount, no validation beyond Number(). */
function Repeater({ title, hint, items, onChange, placeholder }: {
  title: string
  hint: string
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  placeholder: string
}) {
  const update = (i: number, patch: Partial<LineItem>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))

  return (
    <div>
      <label className={LABEL}>{title}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder={placeholder}
              className={FIELD}
            />
            <input
              type="number"
              value={item.amount || ''}
              onChange={(e) => update(i, { amount: Number(e.target.value) || 0 })}
              placeholder="₹"
              className={`${FIELD} w-24 shrink-0`}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Remove"
              className="shrink-0 px-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-200/50 hover:text-red-200 hover:border-red-400/30 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, { label: '', amount: 0 }])}
          className="inline-flex items-center gap-1.5 text-[12px] text-indigo-300 hover:text-white transition-colors"
        >
          <FaPlus className="w-2.5 h-2.5" />
          Add a row
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-indigo-200/40 leading-relaxed">{hint}</p>
    </div>
  )
}
