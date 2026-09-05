// src/pages/pricing.tsx
//
// Public pricing page. Ships BEFORE payments go live: Razorpay's KYC review
// checks the live site for a page showing what is sold and at what price, so
// this page existing is a prerequisite for submitting KYC.
//
// NEXT_PUBLIC_BILLING_ENABLED gates the buy buttons. With output: 'export' the
// value is baked in at build time, so flipping it requires a rebuild — that is
// fine, because it flips exactly once, on the day KYC clears.
import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { fetchPlans, payOnce, startAutopay, type PlansResponse } from '../lib/billing'

const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === '1'

type Period = 'monthly' | 'yearly'

// Single source of truth for displayed prices. When routes/billing.js lands,
// lib/plans.js on the backend holds the authoritative paise amounts; these are
// the display copies and must be kept in step with it.
const PRICES = {
  public: { monthly: 99, yearly: 799 },
  department: { monthly: 75, yearly: 599 },
} as const

const FREE_FEATURES = [
  'Single bill search — unlimited',
  'Bulk check — 30 bills per day',
  '5 saved batches',
  '5 tracked bills',
  '7 days of history and timeline',
  'PDF export',
]

const PRO_FEATURES = [
  'Single bill search — unlimited',
  'Bulk check — 300 bills per day',
  '50 saved batches',
  '50 tracked bills',
  'Full history and timeline',
  'PDF and Excel export',
  'No ads',
]

function Tick() {
  return (
    <svg
      className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function Pricing() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [autopay, setAutopay] = useState(true)
  const { user, refresh } = useAuth()
  const [server, setServer] = useState<PlansResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // The price list is fetched rather than trusted from the constants above,
  // because the department rate depends on a verification record only the
  // server can see. The constants are the pre-login display; this is truth.
  const load = useCallback(async () => {
    if (!user) return
    try {
      setServer(await fetchPlans())
    } catch {
      /* falls back to the public prices already rendered */
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const verified = server?.tier === 'department'
  const live = (server?.billingEnabled ?? BILLING_ENABLED) && !!user

  async function buy() {
    setError(null)
    setBusy(true)
    try {
      if (autopay) {
        await startAutopay(period, { name: user?.username, email: user?.email })
      } else {
        await payOnce(period, { name: user?.username, email: user?.email })
      }
      setDone(true)
      await refresh?.()
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment could not be completed.'
      // Dismissing the Razorpay modal is a choice, not an error to shout about.
      setError(msg === 'Payment cancelled.' || msg === 'Setup cancelled.' ? null : msg)
    } finally {
      setBusy(false)
    }
  }

  const pub = PRICES.public[period]
  const dept = PRICES.department[period]
  const suffix = period === 'monthly' ? '/month' : '/year'
  const yearlySaving = Math.round(
    100 - (PRICES.public.yearly / (PRICES.public.monthly * 12)) * 100
  )

  return (
    <>
      <Head>
        <title>Pricing | CFMS Bills Status</title>
        <meta
          name="description"
          content="CFMS Bills Status pricing — a free plan for everyday use and a Pro plan at ₹99/month or ₹799/year, with a discounted rate for verified Andhra Pradesh government staff."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/pricing" />
      </Head>

      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 relative"
        style={{ minHeight: '100dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

          {/* Back link */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
              ← Back to Home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
              Pricing
            </h1>
            <p className="mt-2 text-indigo-200/60 text-sm max-w-xl mx-auto">
              The bill search stays free. Pro raises the daily limits and unlocks
              full history for people who check bills all day.
            </p>
            <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
          </motion.div>

          {!BILLING_ENABLED && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-center text-sm text-amber-200/80"
            >
              Payments are not open yet. Everything on the site is currently free
              to use — this page is here so you can see what Pro will cost.
            </motion.div>
          )}

          {/* Period toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8 flex justify-center"
          >
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1" role="group" aria-label="Billing period">
              {(['monthly', 'yearly'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  className={
                    'px-5 py-2 text-sm rounded-full transition-colors ' +
                    (period === p
                      ? 'bg-indigo-500/80 text-white'
                      : 'text-indigo-200/70 hover:text-white')
                  }
                >
                  {p === 'monthly' ? 'Monthly' : 'Yearly'}
                  {p === 'yearly' && (
                    <span className="ml-2 text-[11px] text-emerald-300">save {yearlySaving}%</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Plan cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col"
            >
              <h2 className="text-lg font-semibold text-white">Free</h2>
              <p className="mt-1 text-sm text-indigo-200/60">For occasional checks.</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-sm text-indigo-200/50">forever</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-indigo-200/70 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-7 block text-center rounded-xl border border-white/15 px-4 py-2.5 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
              >
                Create a free account
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 border border-indigo-400/30 rounded-2xl p-6 sm:p-8 flex flex-col relative"
            >
              <div className="absolute -top-3 left-6 rounded-full bg-indigo-500 px-3 py-0.5 text-[11px] font-medium text-white">
                Pro
              </div>
              <h2 className="text-lg font-semibold text-white">Pro</h2>
              <p className="mt-1 text-sm text-indigo-200/60">For DDOs and section staff.</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">₹{pub}</span>
                <span className="text-sm text-indigo-200/50">{suffix}</span>
              </div>
              <p className="mt-1.5 text-xs text-indigo-300/70">
                ₹{dept}{suffix} for verified government staff
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-indigo-200/70 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {!live ? (
                <button
                  type="button"
                  disabled
                  className="mt-7 w-full rounded-xl bg-indigo-500/40 px-4 py-2.5 text-sm text-white/70 cursor-not-allowed"
                >
                  {user ? 'Payments open soon' : 'Log in to subscribe'}
                </button>
              ) : done ? (
                <Link
                  href="/settings/billing"
                  className="mt-7 block text-center rounded-xl bg-emerald-500/80 hover:bg-emerald-500 px-4 py-2.5 text-sm text-white transition-colors"
                >
                  You&apos;re on Pro — view billing
                </Link>
              ) : (
                <>
                  <label className="mt-6 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autopay}
                      onChange={(e) => setAutopay(e.target.checked)}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <span className="text-xs text-indigo-200/70">
                      Renew automatically. You are notified 24 hours before each charge
                      and can cancel any time. Untick to pay just once.
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={buy}
                    disabled={busy}
                    className="mt-4 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/40 disabled:cursor-not-allowed px-4 py-2.5 text-sm text-white transition-colors"
                  >
                    {busy ? 'Opening payment…' : `Get Pro — \u20B9${dept && verified ? dept : pub}${suffix}`}
                  </button>
                </>
              )}
              {error && (
                <p className="mt-3 text-xs text-red-300/90">{error}</p>
              )}
            </motion.div>
          </div>

          {/* Department discount */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-3"
          >
            <h2 className="text-lg font-semibold text-white">
              Discount for Andhra Pradesh government staff
            </h2>
            <p className="text-sm leading-relaxed text-indigo-200/70">
              If you work in an AP government department, Pro costs{' '}
              <strong className="text-white">₹{PRICES.department.monthly}/month</strong> or{' '}
              <strong className="text-white">₹{PRICES.department.yearly}/year</strong>. To
              qualify you submit your CFMS ID together with a recent salary paybill,
              and we check it by hand.
            </p>
            <p className="text-sm leading-relaxed text-indigo-200/70">
              The paybill is used only to confirm you work in the department. It is
              visible to the site administrator alone, is never published anywhere,
              and is <strong className="text-white">deleted as soon as the check is
              finished</strong> — whether you are approved or not. All that is kept
              afterwards is your CFMS ID and the decision.
            </p>
            <p className="text-xs text-indigo-300/50">
              Verification is needed once. Approval applies to every later renewal.
            </p>
            {user && (
              verified ? (
                <p className="text-sm text-emerald-300/80">
                  Your department status is verified — the discounted rate is applied
                  automatically at checkout.
                </p>
              ) : (
                <Link
                  href="/settings/department"
                  className="inline-block rounded-xl border border-white/15 px-5 py-2.5 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
                >
                  Get verified
                </Link>
              )
            )}
          </motion.div>

          {/* Payment options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-3"
          >
            <h2 className="text-lg font-semibold text-white">How you pay</h2>
            <p className="text-sm leading-relaxed text-indigo-200/70">
              Two options, and you pick at checkout. A{' '}
              <strong className="text-white">one-time payment</strong> buys a single
              month or year and then simply stops — nothing is stored, nothing renews.
              An <strong className="text-white">automatic renewal</strong> keeps Pro
              running through UPI Autopay or your card, and you can cancel it at any
              time from your account settings.
            </p>
            <p className="text-sm leading-relaxed text-indigo-200/70">
              If you choose automatic renewal, you get a notification at least 24 hours
              before every charge, as required by the Reserve Bank of India. Cancelling
              stops all future charges; the period you have already paid for runs to its
              end. Payments are processed by Razorpay. We never see or store your card
              or UPI details.
            </p>
            <p className="text-sm text-indigo-200/70">
              See the{' '}
              <Link href="/refund-policy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                Refund &amp; Cancellation Policy
              </Link>{' '}
              for full details.
            </p>
          </motion.div>

          {/* Existing users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 sm:p-8 space-y-2"
          >
            <h2 className="text-lg font-semibold text-white">
              Already registered? Pro is on us for six months.
            </h2>
            <p className="text-sm leading-relaxed text-indigo-200/70">
              Everyone who signed up before Pro existed gets six months of it free —
              applied automatically, with nothing to claim and no card needed. Thank you
              for using the site while it was still rough.
            </p>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-10 text-center text-xs text-indigo-200/50"
          >
            <div className="flex items-center justify-center flex-wrap gap-y-2">
              <Link href="/about" className="hover:text-indigo-300 transition-colors underline underline-offset-2">About</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/contact" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Contact</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/refund-policy" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Refunds</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/privacy-policy" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Privacy</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/terms" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Terms</Link>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  )
}
