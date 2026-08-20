import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBell, FaSpinner, FaTrashAlt, FaShieldAlt, FaPause, FaPlay,
  FaExclamationTriangle, FaSyncAlt, FaChevronDown, FaChevronUp,
  FaCircle, FaRegClock,
} from 'react-icons/fa'
import RequireAuth from '../components/RequireAuth'
import AccountBar from '../components/AccountBar'
import {
  fetchTracking, updateTracking, untrackBill, refreshTrackedBill, markTrackedSeen,
  refreshAllTracked,
  TrackingList, TrackedBill,
} from '../lib/auth'

const STOPPED_LABELS: Record<string, string> = {
  terminal: 'Finished — nothing further expected',
  errors: 'Stopped after repeated errors',
  user: 'Paused by you',
  'no-creds': 'Stopped — no stored CFMS credentials',
}

// "Updated 12 minutes ago" is the whole point of this page: the user should
// never have to wonder how current the data is.
function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function timeUntil(iso: string | null): string | null {
  if (!iso) return null
  const secs = Math.floor((new Date(iso).getTime() - Date.now()) / 1000)
  if (secs <= 0) return 'due now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `in ${mins} min`
  const hrs = Math.round(mins / 60)
  return `in ${hrs} hour${hrs === 1 ? '' : 's'}`
}

function TrackingPage() {
  const [data, setData] = useState<TrackingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [recheckingAll, setRecheckingAll] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  // Re-render on a timer so the "N minutes ago" labels stay truthful without
  // refetching anything from the server.
  const [, setTick] = useState(0)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      setData(await fetchTracking())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load tracked bills')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const mutate = async (id: string, fn: () => Promise<unknown>) => {
    setBusy((b) => ({ ...b, [id]: true }))
    setError(null)
    try { await fn(); await load(true) }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed') }
    finally { setBusy((b) => ({ ...b, [id]: false })) }
  }

  // Recheck every tracked bill in one go. The server does this as ONE batched
  // CFMS session rather than N separate reads, and skips anything still inside
  // its per-bill cooldown — so pressing this twice in a row is harmless.
  const recheckAll = async () => {
    setRecheckingAll(true)
    setNotice(null)
    setError(null)
    try {
      const r = await refreshAllTracked()
      if (r.cooldown) {
        setNotice(
          `All ${r.total} bill${r.total === 1 ? '' : 's'} were checked in the last ` +
          `${r.cooldownMinutes ?? 5} minutes. Try again shortly.`
        )
      } else {
        const parts: string[] = []
        parts.push(`Rechecked ${r.refreshed} bill${r.refreshed === 1 ? '' : 's'}`)
        parts.push(r.changed > 0
          ? `${r.changed} changed`
          : 'nothing moved')
        if (r.skipped) parts.push(`${r.skipped} checked too recently`)
        if (r.failed) parts.push(`${r.failed} could not be read`)
        if (r.busy) parts.push('server was busy — some bills were not reached')
        setNotice(parts.join(' · '))
      }
      await load(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not recheck your bills')
    } finally {
      setRecheckingAll(false)
    }
  }

  const toggleOpen = (t: TrackedBill) => {
    const next = !open[t.id]
    setOpen((o) => ({ ...o, [t.id]: next }))
    // Opening the panel is what "seen" means — clear the badge.
    if (next && t.unseenCount > 0) {
      markTrackedSeen(t.id).then(() => load(true)).catch(() => { /* non-critical */ })
    }
  }

  const intervalHours = data ? Math.round(data.intervalMinutes / 60) : 6

  return (
    <>
      <Head>
        <title>Tracked Bills · CFMS Bills Status</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <AccountBar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FaBell className="w-5 h-5 text-indigo-300" />
                Tracked bills
                {!!data?.unseenTotal && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40">
                    {data.unseenTotal} new
                  </span>
                )}
              </h1>
              <p className="text-sm text-indigo-200/70 mt-1">
                Checked automatically every {intervalHours} hours. Press Refresh on any
                bill for a live reading.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {!!data?.hasCredentials && data.activeCount > 0 && (
                <button
                  onClick={recheckAll}
                  disabled={recheckingAll}
                  className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-indigo-400/30 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25 transition disabled:opacity-60"
                  title="Read all tracked bills from CFMS now"
                >
                  <FaSyncAlt className={`w-3 h-3 ${recheckingAll ? 'animate-spin' : ''}`} />
                  {recheckingAll ? 'Rechecking…' : 'Recheck all'}
                </button>
              )}
              <Link
                href="/settings/cfms"
                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition"
              >
                <FaShieldAlt className="w-3 h-3" /> Credentials
              </Link>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-indigo-200/70 py-10 justify-center">
              <FaSpinner className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          {notice && (
            <div className="text-xs text-indigo-100 bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-3 mb-4 flex items-start justify-between gap-3">
              <span>{notice}</span>
              <button onClick={() => setNotice(null)} className="text-indigo-300/60 hover:text-white flex-shrink-0">✕</button>
            </div>
          )}

          {error && !loading && (
            <div className="text-xs text-red-200 bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {!loading && data && !data.hasCredentials && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 mb-5">
              <div className="flex items-start gap-2 text-sm text-amber-100">
                <FaExclamationTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Automatic checking is off</div>
                  <p className="text-xs text-amber-100/80">
                    Tracking needs your CFMS credentials so we can check bills on your
                    behalf. You can still add bills here — they&apos;ll start updating
                    once credentials are saved.
                  </p>
                  <Link href="/settings/cfms" className="text-xs underline mt-2 inline-block">
                    Set up credentials →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!loading && data && (
            <>
              <div className="text-xs text-indigo-300/60 mb-3">
                {data.activeCount} of {data.limit} slots in use
              </div>

              {data.tracked.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-sm text-indigo-200/70">No bills tracked yet.</p>
                  <p className="text-xs text-indigo-300/50 mt-1">
                    Open <Link href="/bulk-check" className="underline">Bulk Check</Link> and
                    use the Track button on any bill.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {data.tracked.map((t) => {
                  const isOpen = !!open[t.id]
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border overflow-hidden ${
                        t.unseenCount > 0
                          ? 'border-amber-400/40 bg-amber-500/[0.07]'
                          : t.active
                          ? 'border-white/15 bg-white/5'
                          : 'border-white/10 bg-black/20 opacity-75'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-white">{t.billNumber}</span>
                              {t.unseenCount > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-100 border border-amber-400/40">
                                  {t.unseenCount} new
                                </span>
                              )}
                            </div>
                            {t.label && (
                              <div className="text-xs text-indigo-200/80 mt-0.5">{t.label}</div>
                            )}

                            <div className="text-[11px] text-indigo-300/60 mt-1.5 space-y-0.5">
                              {t.lastPendingAt && (
                                <div className="text-indigo-100/80">
                                  {t.lastVerdict === 'PAID' ? 'Paid' : `At ${t.lastPendingAt}`}
                                </div>
                              )}
                              {/* The freshness line. This is what replaces an email. */}
                              <div className="flex items-center gap-1.5">
                                <FaRegClock className="w-2.5 h-2.5" />
                                Status last updated {timeAgo(t.lastCheckedAt)}
                              </div>
                              {t.active && t.nextCheckAt && (
                                <div className="text-indigo-300/40">
                                  Next automatic check {timeUntil(t.nextCheckAt)}
                                </div>
                              )}
                              {!t.active && t.stoppedReason && (
                                <div className="text-amber-200/70">
                                  {STOPPED_LABELS[t.stoppedReason] || t.stoppedReason}
                                </div>
                              )}
                              {!!t.errorCount && t.active && (
                                <div className="text-amber-200/70">
                                  {t.errorCount} recent check failure(s)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {t.active && (
                              <button
                                onClick={() => mutate(t.id, () => refreshTrackedBill(t.id))}
                                disabled={busy[t.id]}
                                title="Check CFMS right now"
                                className="p-2 rounded-lg border border-indigo-400/30 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25 transition disabled:opacity-50"
                              >
                                {busy[t.id]
                                  ? <FaSpinner className="w-3 h-3 animate-spin" />
                                  : <FaSyncAlt className="w-3 h-3" />}
                              </button>
                            )}
                            <button
                              onClick={() => mutate(t.id, () => updateTracking(t.id, { active: !t.active }))}
                              disabled={busy[t.id]}
                              title={t.active ? 'Pause tracking' : 'Resume tracking'}
                              className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
                            >
                              {t.active ? <FaPause className="w-3 h-3" /> : <FaPlay className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Stop tracking ${t.billNumber}?`)) {
                                  mutate(t.id, () => untrackBill(t.id))
                                }
                              }}
                              disabled={busy[t.id]}
                              title="Remove"
                              className="p-2 rounded-lg border border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition disabled:opacity-50"
                            >
                              <FaTrashAlt className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {t.changes.length > 0 && (
                          <button
                            onClick={() => toggleOpen(t)}
                            className="mt-3 text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition"
                          >
                            {isOpen ? <FaChevronUp className="w-2.5 h-2.5" /> : <FaChevronDown className="w-2.5 h-2.5" />}
                            {isOpen ? 'Hide' : `${t.changes.length} update${t.changes.length === 1 ? '' : 's'}`}
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {isOpen && t.changes.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10 bg-black/20 overflow-hidden"
                          >
                            <ol className="p-4 space-y-2.5">
                              {t.changes.map((c, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <FaCircle
                                    className={`w-1.5 h-1.5 mt-1.5 flex-shrink-0 ${
                                      c.kind === 'note' ? 'text-amber-300'
                                        : c.kind === 'finished' ? 'text-emerald-300'
                                        : 'text-indigo-300'
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs text-indigo-100">{c.summary}</div>
                                    {c.remark && (
                                      <div className="text-[11px] text-amber-100/70 mt-0.5 italic">
                                        “{c.remark}”
                                      </div>
                                    )}
                                    <div className="text-[10px] text-indigo-300/40 mt-0.5">
                                      {c.at ? new Date(c.at).toLocaleString() : ''}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function Page() {
  return <RequireAuth><TrackingPage /></RequireAuth>
}
