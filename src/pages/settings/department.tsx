// src/pages/settings/department.tsx — the government staff discount.
//
// Four states, one page. The word "rejected" never appears: a user who is not
// eligible for a discount has not been rejected by the service, and telling a
// government employee that a bill-tracking site "rejected" them is a support
// email nobody needs. The database calls it rejected because that is what it
// is; the screen says "not eligible".

import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import RequireAuth from '../../components/RequireAuth';
import {
  fetchVerification,
  submitVerification,
  type VerificationState,
} from '../../lib/billing';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED = '.pdf,.jpg,.jpeg,.png';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4"
    >
      {children}
    </motion.div>
  );
}

function DepartmentInner() {
  const [state, setState] = useState<VerificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [cfmsId, setCfmsId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setState(await fetchVerification());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    setError(null);

    if (picked.length > 2) {
      setError('Please attach at most two files.');
      return;
    }
    // Checked here as well as on the server, purely so the user finds out
    // before a slow upload rather than after it.
    const tooBig = picked.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than 2 MB. Please attach a smaller file.`);
      return;
    }
    setFiles(picked);
  }

  async function onSubmit() {
    setError(null);
    if (!cfmsId.trim()) return setError('Please enter your CFMS ID.');
    if (files.length < 1) return setError('Please attach at least one salary paybill.');
    if (!consent) return setError('Please tick the box to confirm before submitting.');

    setBusy(true);
    try {
      await submitVerification({ cfmsId: cfmsId.trim(), files });
      setFiles([]);
      setConsent(false);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your request.');
    } finally {
      setBusy(false);
    }
  }

  const status = state?.status ?? null;
  const showForm = !loading && (status === null || status === 'action_required');

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
          ← Back to Pricing
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
          Government staff verification
        </h1>
        <p className="mt-2 text-indigo-200/60 text-sm">
          Verify once and get Pro at the discounted rate, for every renewal after.
        </p>
        <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
      </motion.div>

      {loading && (
        <div className="text-center text-indigo-200/50 text-sm py-8">Loading your status…</div>
      )}

      {/* ── In process ── */}
      {status === 'pending' && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-lg font-semibold text-white">In process</h2>
          </div>
          <p className="text-sm leading-relaxed text-indigo-200/70">
            We have your CFMS ID and your paybill. We will check the details by hand
            and get back to you — usually within a day.
          </p>
          <p className="text-xs text-indigo-300/50">
            Submitted {state?.submittedAt ? new Date(state.submittedAt).toLocaleDateString('en-IN') : ''}
            {state?.attempts && state.attempts > 1 ? ` · attempt ${state.attempts}` : ''}
          </p>
        </Card>
      )}

      {/* ── Approved ── */}
      {status === 'approved' && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Verified</h2>
          </div>
          <p className="text-sm leading-relaxed text-indigo-200/70">
            Your CFMS ID is verified. You are eligible for the department rate —{' '}
            <strong className="text-white">₹75/month</strong> or{' '}
            <strong className="text-white">₹599/year</strong>. It is applied
            automatically at checkout and to every renewal.
          </p>
          <p className="text-sm text-indigo-200/70">
            Your paybill was deleted when we recorded the decision. We kept only your
            CFMS ID and the outcome.
          </p>
          <Link
            href="/pricing"
            className="inline-block mt-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-5 py-2.5 text-sm text-white transition-colors"
          >
            Continue at the department rate
          </Link>
        </Card>
      )}

      {/* ── Not eligible ── */}
      {status === 'rejected' && (
        <Card>
          <h2 className="text-lg font-semibold text-white">Not eligible for the department rate</h2>
          {state?.rejectionReason && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-indigo-200/80">{state.rejectionReason}</p>
            </div>
          )}
          <p className="text-sm leading-relaxed text-indigo-200/70">
            Your account is unaffected and everything keeps working. You can subscribe
            at the standard rate at any time.
          </p>
          <p className="text-sm leading-relaxed text-indigo-200/70">
            If you believe this is a mistake, please{' '}
            <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
              get in touch
            </Link>
            .
          </p>
          <Link
            href="/pricing"
            className="inline-block mt-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
          >
            See standard plans
          </Link>
        </Card>
      )}

      {/* ── Needs attention ── */}
      {status === 'action_required' && (
        <div className="mb-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5 space-y-2"
          >
            <h2 className="text-base font-semibold text-white">We need something from you</h2>
            {state?.actionReason && (
              <p className="text-sm text-amber-100/80">{state.actionReason}</p>
            )}
            <p className="text-xs text-amber-200/50">
              Your previous attachment was deleted. Please attach it again below.
            </p>
          </motion.div>
        </div>
      )}

      {/* ── Form ── */}
      {showForm && (
        <Card>
          {status === null && (
            <>
              <h2 className="text-lg font-semibold text-white">Get the department rate</h2>
              <p className="text-sm leading-relaxed text-indigo-200/70">
                If you work in an Andhra Pradesh government department, Pro costs{' '}
                <strong className="text-white">₹75/month</strong> or{' '}
                <strong className="text-white">₹599/year</strong> instead of ₹99 and ₹799.
              </p>
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="cfmsId" className="block text-sm text-indigo-200/80">
              Your CFMS ID
            </label>
            <input
              id="cfmsId"
              type="text"
              value={cfmsId}
              onChange={(e) => setCfmsId(e.target.value)}
              placeholder="As it appears on your paybill"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-indigo-200/30 focus:outline-none focus:border-indigo-400/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="documents" className="block text-sm text-indigo-200/80">
              Recent salary paybill
            </label>
            <input
              id="documents"
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              multiple
              onChange={onPick}
              className="w-full text-sm text-indigo-200/70 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/80 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-indigo-500"
            />
            <p className="text-xs text-indigo-300/50">
              PDF, JPG or PNG. Up to two files, each under 2 MB. One month is enough;
              attach two if you have them.
            </p>
            {files.length > 0 && (
              <ul className="text-xs text-indigo-200/60 space-y-1 pt-1">
                {files.map((f) => (
                  <li key={f.name}>
                    {f.name} · {(f.size / 1024).toFixed(0)} KB
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs leading-relaxed text-indigo-200/70">
              Your paybill is used for one thing only: confirming that you work in the
              department. It is visible to the site administrator alone, is never
              published anywhere, and is{' '}
              <strong className="text-white">deleted as soon as the check is finished</strong>{' '}
              — whether or not you are approved. All that is kept afterwards is your
              CFMS ID and the decision.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-indigo-500"
              />
              <span className="text-xs text-indigo-200/80">
                I agree to my paybill being used to verify my employment, and I confirm
                the details I have given are true.
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm text-red-200/90">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/40 disabled:cursor-not-allowed px-5 py-3 text-sm text-white transition-colors"
          >
            {busy ? 'Submitting…' : 'Submit for verification'}
          </button>
        </Card>
      )}

      {!loading && error && !showForm && (
        <p className="mt-4 text-center text-sm text-red-300/80">{error}</p>
      )}
    </div>
  );
}

export default function DepartmentVerificationPage() {
  return (
    <>
      <Head>
        <title>Government staff verification | CFMS Bills Status</title>
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
          <DepartmentInner />
        </RequireAuth>
      </main>
    </>
  );
}
