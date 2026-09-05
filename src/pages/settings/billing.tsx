// src/pages/settings/billing.tsx — your plan, your payments, your cancel button.
//
// Cancelling is deliberately self-service and one click. A cancel flow that
// requires emailing support produces chargebacks, and a chargeback costs a fee
// and counts against merchant standing while a cancellation costs nothing.

import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RequireAuth from '../../components/RequireAuth';
import {
  fetchPlans,
  fetchPayments,
  cancelAutopay,
  formatINR,
  type PlansResponse,
  type PaymentRow,
} from '../../lib/billing';

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
}

function BillingInner() {
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Payment history is non-essential: if it fails, the plan panel should
      // still render rather than the whole page erroring out.
      const [p, h] = await Promise.allSettled([fetchPlans(), fetchPayments()]);
      if (p.status === 'fulfilled') setPlans(p.value);
      else setError(p.reason instanceof Error ? p.reason.message : 'Could not load your plan.');
      if (h.status === 'fulfilled') setPayments(h.value.payments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancel() {
    setBusy(true);
    setError(null);
    try {
      const r = await cancelAutopay();
      setNotice(r.message);
      setConfirming(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel.');
    } finally {
      setBusy(false);
    }
  }

  const sub = plans?.current ?? null;
  const isPro = !!sub?.active && !!sub.expiresAt && new Date(sub.expiresAt).getTime() > Date.now();
  const left = daysLeft(sub?.expiresAt);
  const autopayLive = sub?.mode === 'autopay' && !sub.cancelAtPeriodEnd;

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
          ← Back to Home
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
          Billing
        </h1>
        <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
      </motion.div>

      {loading && <div className="text-center text-indigo-200/50 text-sm py-8">Loading…</div>}

      {notice && (
        <div className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100/85">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm text-red-200/90">
          {error}
        </div>
      )}

      {!loading && plans && (
        <>
          {/* Current plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isPro ? 'Pro' : 'Free'}
                </h2>
                <p className="mt-1 text-sm text-indigo-200/60">
                  {isPro
                    ? sub?.mode === 'grandfathered'
                      ? 'Free for six months, with our thanks for being an early user.'
                      : sub?.mode === 'autopay'
                        ? 'Renews automatically.'
                        : 'One-time payment. Does not renew by itself.'
                    : 'Bill search is unlimited. Pro raises the daily limits.'}
                </p>
              </div>
              {isPro && (
                <span className="shrink-0 rounded-full bg-indigo-500/80 px-3 py-1 text-xs text-white">
                  {plans.tier === 'department' ? 'Dept rate' : 'Pro'}
                </span>
              )}
            </div>

            {isPro && (
              <dl className="grid grid-cols-2 gap-3 text-sm pt-2">
                <div>
                  <dt className="text-indigo-200/50 text-xs">Active until</dt>
                  <dd className="text-white">{fmtDate(sub?.expiresAt)}</dd>
                </div>
                <div>
                  <dt className="text-indigo-200/50 text-xs">Days remaining</dt>
                  <dd className="text-white">{left ?? '—'}</dd>
                </div>
              </dl>
            )}

            {sub?.cancelAtPeriodEnd && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/80">
                Automatic renewal is off. Pro stays active until {fmtDate(sub.expiresAt)}, then your
                account returns to the free plan. Nothing you have saved is deleted.
              </div>
            )}

            {sub?.autopayStatus === 'halted' && (
              <div className="rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm text-red-200/85">
                We could not collect your last renewal. Please check with your bank, or
                pay for a single period to keep Pro active.
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {!isPro && (
                <Link
                  href="/pricing"
                  className="rounded-xl bg-indigo-500 hover:bg-indigo-400 px-5 py-2.5 text-sm text-white transition-colors"
                >
                  See plans
                </Link>
              )}
              {isPro && !autopayLive && (
                <Link
                  href="/pricing"
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
                >
                  Extend or change plan
                </Link>
              )}
              {autopayLive && !confirming && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
                >
                  Cancel automatic renewal
                </button>
              )}
            </div>

            {confirming && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-sm text-indigo-200/80">
                  Cancelling stops all future charges. Pro stays active until{' '}
                  <strong className="text-white">{fmtDate(sub?.expiresAt)}</strong> — you keep
                  what you have already paid for, and nothing you have saved is deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="rounded-xl bg-red-500/80 hover:bg-red-500 disabled:opacity-50 px-4 py-2 text-sm text-white transition-colors"
                  >
                    {busy ? 'Cancelling…' : 'Yes, cancel renewal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
                  >
                    Keep it
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Department rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2"
          >
            <h2 className="text-base font-semibold text-white">Government staff rate</h2>
            <p className="text-sm text-indigo-200/70">
              {plans.tier === 'department'
                ? 'Your department status is verified. The discounted rate is applied automatically.'
                : 'Work in an AP government department? Verify once for a lower rate on every renewal.'}
            </p>
            {plans.tier !== 'department' && (
              <Link
                href="/settings/department"
                className="inline-block pt-1 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              >
                Get verified
              </Link>
            )}
          </motion.div>

          {/* Payment history */}
          {payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3"
            >
              <h2 className="text-base font-semibold text-white">Payments</h2>
              <div className="divide-y divide-white/5">
                {payments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <div className="text-white">
                        {formatINR(p.amountRupees)}{' '}
                        <span className="text-indigo-200/50 text-xs">
                          {p.period === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      <div className="text-xs text-indigo-200/50 truncate">
                        {fmtDate(p.createdAt)}
                        {p.reference ? ` · ${p.reference}` : ''}
                      </div>
                    </div>
                    <span
                      className={
                        'shrink-0 rounded-full px-2.5 py-0.5 text-xs ' +
                        (p.status === 'captured'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : p.status === 'refunded'
                            ? 'bg-indigo-400/10 text-indigo-300'
                            : 'bg-red-400/10 text-red-300')
                      }
                    >
                      {p.status === 'captured' ? 'Paid' : p.status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-indigo-300/50 pt-1">
                Quote the reference shown here if you need to ask about a payment. See the{' '}
                <Link href="/refund-policy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  refund policy
                </Link>
                .
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default function BillingSettingsPage() {
  return (
    <>
      <Head>
        <title>Billing | CFMS Bills Status</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 relative"
        style={{ minHeight: '100dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        </div>
        <RequireAuth>
          <BillingInner />
        </RequireAuth>
      </main>
    </>
  );
}
