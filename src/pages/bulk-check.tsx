// src/pages/bulk-check.tsx
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import RequireAuth from '../components/RequireAuth'
import AccountBar from '../components/AccountBar'
import {
  listBatches,
  createBatch as apiCreateBatch,
  updateBatch as apiUpdateBatch,
  deleteBatch as apiDeleteBatch,
  migrateBatches,
  getToken,
  CloudBatch,
} from '../lib/auth'
import {
  FaRegTrashAlt,
  FaTimes,
  FaHistory,
  FaPlay,
  FaFileDownload,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRedo,
  FaBolt,
} from 'react-icons/fa'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'

// ───── Types ─────
type BillNote = {
  seq: number
  author: string
  date: string
  remark: string
  problemLabel?: string | null
}

type BillResult = {
  billNumber: string
  verdict: string
  billStatus?: string | null
  netAmount?: string | null
  pendingAt?: string | null      // processor where bill is currently stuck
  pendingAction?: string | null  // action pending at that processor
  beneficiaryName?: string | null
  paymentStatus?: string | null
  paymentRef?: string | null
  paymentDate?: string | null
  userDescription?: string
  error?: string
  // ── Processor/auditor notes (e.g. "...bill may be returned") ──
  notes?: BillNote[]
  latestNote?: BillNote | null
  problemNotes?: BillNote[]
  hasNoteWarning?: boolean
  incomplete?: boolean  // core fields (name/net/status) didn't load — offer retry
  fromCache?: boolean   // v4.0: served from the server's recent-results cache
}

type ApiResponse = {
  results: BillResult[]
  checkedAt: string
  elapsedSeconds?: number
  summary: { total: number; byVerdict: Record<string, number> }
  // ── v4.0 ──
  cachedCount?: number   // bills answered from recent results, no CFMS trip
  queueWaitMs?: number   // time this request spent waiting for a free slot
}

type BatchHistoryItem = {
  id: string
  name: string
  bills: string[]
  createdAt: number
  lastRunAt: number | null
  lastSummary: Record<string, number> | null
  source?: 'synced' | 'local'  // where this batch lives (account vs this device)
}

// ───── Verdict styling ─────
const VERDICT_LABEL: Record<string, string> = {
  PAID: 'Paid',
  APPROVED_PAYMENT_PENDING: 'Approved · Payment Pending',
  APPROVED: 'Approved',
  IN_PROCESS: 'In Process',
  STUCK_AT_ATO: 'At ATO',
  STUCK_AT_STO: 'At Sub Treasury',
  STUCK_AT_AUDITOR: 'At Auditor',
  STUCK_AT_EE: 'At Executive Engineer',
  REJECTED: 'Rejected',
  RETURNED: 'Returned',
  NOTE_FLAGGED_RETURN: 'Flagged — May Be Returned',
  ERROR: 'Error',
  AUTH_FAILED: 'Auth Failed',
  PAGE_LOAD_FAILED: 'Page Failed',
  NOT_FOUND: 'Bill Not Found',
  UNKNOWN: 'Could not read',
}

const VERDICT_PILL: Record<string, string> = {
  PAID: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  APPROVED_PAYMENT_PENDING: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  APPROVED: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  IN_PROCESS: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  STUCK_AT_ATO: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  STUCK_AT_STO: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  STUCK_AT_AUDITOR: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  STUCK_AT_EE: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  REJECTED: 'bg-red-500/20 text-red-200 border-red-400/30',
  RETURNED: 'bg-red-500/20 text-red-200 border-red-400/30',
  NOTE_FLAGGED_RETURN: 'bg-rose-500/25 text-rose-100 border-rose-400/50',
  ERROR: 'bg-red-500/20 text-red-200 border-red-400/30',
  AUTH_FAILED: 'bg-red-500/20 text-red-200 border-red-400/30',
  PAGE_LOAD_FAILED: 'bg-red-500/20 text-red-200 border-red-400/30',
  NOT_FOUND: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  UNKNOWN: 'bg-white/10 text-indigo-200 border-white/10',
}

const VERDICT_ICON: Record<string, React.ReactNode> = {
  PAID: <FaCheckCircle className="w-3 h-3" />,
  APPROVED_PAYMENT_PENDING: <FaClock className="w-3 h-3" />,
  APPROVED: <FaCheckCircle className="w-3 h-3" />,
  NOTE_FLAGGED_RETURN: <FaExclamationTriangle className="w-3 h-3" />,
}

// Human-readable reason shown under a bill's row, per verdict. Gives users a
// clear next step instead of a bare code.
const VERDICT_REASON: Record<string, string> = {
  NOT_FOUND: "This bill number wasn't found in CFMS. Please double-check the number and year.",
  UNKNOWN: 'CFMS didn’t return this bill’s data (the portal was slow or busy). Tap Retry to try again.',
  ERROR: 'Something went wrong while fetching this bill. Tap Retry to try again.',
  AUTH_FAILED: 'Your CFMS login was rejected. Please check your username and password.',
  PAGE_LOAD_FAILED: 'The CFMS page didn’t load for this bill. Tap Retry to try again.',
}

// Which verdicts are worth retrying (transient). NOT_FOUND and AUTH_FAILED are
// NOT retryable — the bill doesn't exist, or the credentials are wrong.
// ───── Shared call to /api/check-bills (v4.0) ─────
// All three call sites (initial check, single retry, retry-all) went through
// near-identical fetch blocks. Centralising them means the new backend
// behaviours are handled in one place instead of three:
//
//   * forceRefresh — the server now caches results for ~10 minutes. Without
//     this flag a Retry could be handed the very cached result it is retrying
//     against, which made the button silently useless.
//   * 429 / 503    — the server no longer hangs when busy; it answers
//     immediately with a queue depth. Previously this surfaced to the user as
//     a bare "HTTP 429".
async function postCheck(body: {
  username: string
  password: string
  billNumbers: string[]
  forceRefresh?: boolean
}): Promise<ApiResponse> {
  const token = getToken()
  const res = await fetch(`${API_URL}/api/check-bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  let data: any = null
  try { data = await res.json() } catch { /* non-JSON error body */ }

  if (!res.ok) {
    if (res.status === 429 || res.status === 503) {
      const ahead = typeof data?.queueDepth === 'number' ? data.queueDepth : 0
      throw new Error(
        ahead > 0
          ? `The server is busy — ${ahead} ${ahead === 1 ? 'check is' : 'checks are'} ahead of yours. Please try again in a minute.`
          : 'The server is busy right now. Please try again in a minute.'
      )
    }
    throw new Error(data?.error || `HTTP ${res.status}`)
  }
  return data as ApiResponse
}

const RETRYABLE_VERDICTS = new Set(['UNKNOWN', 'ERROR', 'PAGE_LOAD_FAILED'])
function isRetryable(r: { verdict: string; incomplete?: boolean }): boolean {
  return RETRYABLE_VERDICTS.has(r.verdict) || (!!r.incomplete && r.verdict !== 'NOT_FOUND' && r.verdict !== 'AUTH_FAILED')
}

const STORAGE_KEY = 'bulkBillHistory'
const MIGRATED_FLAG = 'bulkBillHistory_migrated_v2'
const MAX_HISTORY = 50

function BulkCheck() {
  // ─── Form state ───
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [billsText, setBillsText] = useState('')
  const [batchName, setBatchName] = useState('')

  // ─── Request state ───
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0) // seconds since "Check All Bills" was clicked
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [retryingBills, setRetryingBills] = useState<Record<string, boolean>>({})
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingPdfNotes, setExportingPdfNotes] = useState(false)

  // ─── History state ───
  const [history, setHistory] = useState<BatchHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)

  // ─── Live elapsed timer: ticks every second while a check is running ───
  useEffect(() => {
    if (!loading) return
    const startedAt = Date.now()
    setElapsed(0)
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [loading])
  const billsTextRef = useRef<HTMLTextAreaElement>(null)

  // ─── Load history on mount ───
  // IMPORTANT: migration from localStorage runs ONCE per device (guarded by a
  // flag). After that we ONLY list from the cloud — the cloud is the source of
  // truth. The old code re-ran migration on every load, which (because client
  // batch ids change after the first migration) spawned duplicate batches on
  // every refresh until the 50-batch cap was hit. Migrate-once kills that loop.
  useEffect(() => {
    let cancelled = false

    function readLocal(): BatchHistoryItem[] {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return []
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    async function load() {
      const local = readLocal()
      const alreadyMigrated = (() => {
        try { return localStorage.getItem(MIGRATED_FLAG) === '1' } catch { return false }
      })()

      // Show cached local history immediately so the sidebar isn't blank while
      // the (possibly slow) cloud request is in flight.
      if (local.length > 0 && !cancelled) {
        setHistory(local.map((b) => ({ ...b, source: 'synced' as const })))
      }

      setHistoryLoading(true)
      try {
        let cloud: CloudBatch[]
        if (local.length > 0 && !alreadyMigrated) {
          // FIRST login on this device with local history → migrate once.
          const res = await migrateBatches(local as CloudBatch[])
          cloud = res.batches
          try { localStorage.setItem(MIGRATED_FLAG, '1') } catch {}
        } else {
          // Normal path: cloud is authoritative. Never re-migrate.
          const res = await listBatches()
          cloud = res.batches
          // Mark migrated so we never accidentally re-upload the local cache.
          try { localStorage.setItem(MIGRATED_FLAG, '1') } catch {}
        }
        if (cancelled) return
        const tagged = cloud.map((b) => ({ ...b, source: 'synced' as const }))
        setHistory(tagged)
        // Mirror cloud → localStorage purely as an offline cache (never re-uploaded).
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud)) } catch {}
      } catch {
        // Backend unreachable → keep whatever is cached locally (already shown).
        if (!cancelled && local.length === 0) setHistory([])
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ─── Responsive ───
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // ─── Click-outside sidebar ───
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsSidebarOpen(false)
      }
    }
    if (isSidebarOpen) document.addEventListener('mousedown', handler)
    else document.removeEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isSidebarOpen])

  // ─── Animated progress while loading ───
  useEffect(() => {
    if (!loading) return
    setProgress(5)
    const bills = parseBills(billsText)
    const totalMs = Math.max(bills.length * 1000, 5000)
    const id = setInterval(() => setProgress((p) => Math.min(p + 2, 92)), totalMs / 45)
    return () => clearInterval(id)
  }, [loading, billsText])

  function parseBills(raw: string): string[] {
    // Split by newlines only (not by spaces/commas) so descriptions stay attached.
    // Each line is sent as-is to the backend, which extracts bill number + description.
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Update local state + mirror to localStorage (cache/backup for offline).
  function saveHistory(next: BatchHistoryItem[]) {
    setHistory(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  // ─── Submit ───
  async function handleCheck(e?: React.FormEvent, billsOverride?: string[], batchIdOverride?: string) {
    if (e) e.preventDefault()
    setError(null)
    setResponse(null)
    setExpanded({})

    const bills = billsOverride ?? parseBills(billsText)

    if (!username || !password) {
      setError('Enter your CFMS username and password.')
      return
    }
    if (bills.length === 0) {
      setError('Paste at least one bill number.')
      return
    }
    if (bills.length > 30) {
      setError('Maximum 30 bills per batch. Split into smaller batches.')
      return
    }

    setLoading(true)
    try {
      const data = await postCheck({ username, password, billNumbers: bills })
      setResponse(data)
      setProgress(100)

      // ─── Save / update batch history (cloud-backed, local mirror) ───
      const summary = data.summary?.byVerdict || {}
      if (batchIdOverride) {
        // Update existing batch's lastRunAt + lastSummary (optimistic UI + cloud sync).
        const next = history.map((b) =>
          b.id === batchIdOverride
            ? { ...b, lastRunAt: Date.now(), lastSummary: summary, bills }
            : b
        )
        saveHistory(next)
        try {
          await apiUpdateBatch(batchIdOverride, { bills, lastRunAt: Date.now(), lastSummary: summary })
        } catch { /* keep local copy if cloud update fails */ }
      } else {
        // Save as a new batch. Create in the cloud, then use the returned
        // (server-issued) id so future updates/deletes target the right record.
        const optimistic: BatchHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: batchName.trim() || `Batch of ${bills.length} bills`,
          bills,
          createdAt: Date.now(),
          lastRunAt: Date.now(),
          lastSummary: summary,
          source: 'synced',
        }
        const next = [optimistic, ...history].slice(0, MAX_HISTORY)
        saveHistory(next)
        setBatchName('')
        try {
          const { batch } = await apiCreateBatch({
            name: optimistic.name,
            bills,
            lastRunAt: optimistic.lastRunAt,
            lastSummary: summary,
          })
          // Swap the optimistic id for the real server id.
          saveHistory([{ ...batch, source: 'synced' as const }, ...next.filter((b) => b.id !== optimistic.id)].slice(0, MAX_HISTORY))
        } catch { /* keep optimistic local copy if cloud create fails */ }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ─── Manual single-bill retry (for bills still UNKNOWN after auto-retry) ───
  // Re-checks ONE bill using the credentials still held in memory. If the user
  // has refreshed (credentials gone), we surface a clear message instead.
  async function retryBill(billNumber: string) {
    if (!username || !password) {
      setError('Please re-enter your CFMS username and password to retry.')
      return
    }
    setRetryingBills((m) => ({ ...m, [billNumber]: true }))
    try {
      // forceRefresh: bypass AND evict the server cache, so Retry really
      // re-reads CFMS rather than replaying the result being retried.
      const data = await postCheck({
        username, password, billNumbers: [billNumber], forceRefresh: true,
      })
      const fresh = data.results && data.results[0]
      if (fresh) {
        // Replace just this bill's result in the existing response, preserving
        // the user's description, and recompute the summary counts.
        setResponse((prev) => {
          if (!prev) return prev
          const updatedResults = prev.results.map((r) =>
            r.billNumber === billNumber
              ? { ...fresh, userDescription: r.userDescription }
              : r
          )
          const byVerdict: Record<string, number> = {}
          for (const r of updatedResults) {
            const v = r.verdict || 'UNKNOWN'
            byVerdict[v] = (byVerdict[v] || 0) + 1
          }
          return {
            ...prev,
            results: updatedResults,
            summary: { ...prev.summary, byVerdict },
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetryingBills((m) => {
        const next = { ...m }
        delete next[billNumber]
        return next
      })
    }
  }

  // Retry ALL failed/retryable bills at once (the action-bar "Retry Failed"
  // button). Re-runs just those bills through the normal endpoint and merges
  // the fresh results back in, preserving each bill's description.
  const [retryingAll, setRetryingAll] = useState(false)
  // v4.0: how many checks are waiting on the server right now. Polled only
  // while our own request is in flight, so a slow batch reads as "the server
  // is busy" rather than as an unexplained spinner.
  const [serverQueued, setServerQueued] = useState(0)
  async function retryAllFailed() {
    if (!response) return
    if (!username || !password) {
      setError('Please re-enter your CFMS username and password to retry.')
      return
    }
    const failed = response.results.filter(isRetryable).map((r) => r.billNumber)
    if (failed.length === 0) return
    setRetryingAll(true)
    setError(null)
    try {
      const data = await postCheck({
        username, password, billNumbers: failed, forceRefresh: true,
      })
      const freshByBill: Record<string, any> = {}
      for (const fr of (data.results || [])) freshByBill[fr.billNumber] = fr
      setResponse((prev) => {
        if (!prev) return prev
        const updatedResults = prev.results.map((r) =>
          freshByBill[r.billNumber]
            ? { ...freshByBill[r.billNumber], userDescription: r.userDescription }
            : r
        )
        const byVerdict: Record<string, number> = {}
        for (const r of updatedResults) {
          const v = r.verdict || 'UNKNOWN'
          byVerdict[v] = (byVerdict[v] || 0) + 1
        }
        return { ...prev, results: updatedResults, summary: { ...prev.summary, byVerdict } }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetryingAll(false)
    }
  }

  // Poll the health endpoint while a check is running so the user can see
  // that a long wait is server load, not a hung page. Stops the moment the
  // request settles. Failures are ignored — this is decoration, not function.
  useEffect(() => {
    const busy = loading || retryingAll
    if (!busy) { setServerQueued(0); return }
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setServerQueued(data?.queue?.queued ?? 0)
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 6000)
    return () => { cancelled = true; clearInterval(id) }
  }, [loading, retryingAll])

  // ─── History actions ───
  function loadBatch(batch: BatchHistoryItem) {
    setBillsText(batch.bills.join('\n'))
    setBatchName(batch.name)
    setIsSidebarOpen(false)
    billsTextRef.current?.focus()
  }

  function rerunBatch(batch: BatchHistoryItem) {
    if (!username || !password) {
      setBillsText(batch.bills.join('\n'))
      setBatchName(batch.name)
      setIsSidebarOpen(false)
      setError('Enter credentials, then click "Check All Bills" to re-run.')
      return
    }
    setBillsText(batch.bills.join('\n'))
    setBatchName(batch.name)
    setIsSidebarOpen(false)
    handleCheck(undefined, batch.bills, batch.id)
  }

  function deleteBatch(id: string) {
    // Optimistic local removal + mirror, then sync to cloud.
    saveHistory(history.filter((b) => b.id !== id))
    apiDeleteBatch(id).catch(() => { /* already removed locally */ })
  }

  function renameBatch(id: string, newName: string) {
    saveHistory(history.map((b) => (b.id === id ? { ...b, name: newName } : b)))
    apiUpdateBatch(id, { name: newName }).catch(() => { /* keep local rename */ })
  }

  // ─── Export CSV ───
  function exportCSV() {
    if (!response) return
    const headers = [
      'Bill Number', 'Description', 'Verdict', 'Bill Status',
      'Pending At', 'Pending Action', 'Net Amount',
      'Beneficiary', 'Payment Status', 'Payment Ref', 'Payment Date',
      'Note Warning', 'Note Remark', 'Note By', 'Note Date',
    ]
    const rows = response.results.map((r) => {
      const prob = r.problemNotes && r.problemNotes.length > 0 ? r.problemNotes[0] : null
      return [
        r.billNumber,
        r.userDescription || '',
        r.verdict,
        r.billStatus || '',
        r.pendingAt || '',
        r.pendingAction || '',
        r.netAmount || '',
        r.beneficiaryName || '',
        r.paymentStatus || '',
        r.paymentRef || '',
        r.paymentDate || '',
        prob?.problemLabel || '',
        prob?.remark || '',
        prob?.author || '',
        prob?.date || '',
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cfms-bills-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Export PDF ───
  // One readable block per bill: header (bill# + verdict), a label/value grid of
  // all fields, and a highlighted callout for any flagged "may be returned" note.
  // jsPDF is loaded on demand so it stays out of the main bundle.
  // Shared generator for both PDF buttons. includeNotes=false -> the original
  // status report; includeNotes=true -> the same report plus every note from
  // every person on each bill (full history, continuous flow).
  async function generatePDF(includeNotes: boolean) {
    if (!response) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })

      const PAGE_W = doc.internal.pageSize.getWidth()
      const PAGE_H = doc.internal.pageSize.getHeight()
      const M = 40 // margin
      const CONTENT_W = PAGE_W - M * 2
      let y = M

      const ensureSpace = (needed: number) => {
        if (y + needed > PAGE_H - M) {
          doc.addPage()
          y = M
        }
      }

      // ── Title ──
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 60)
      doc.text(includeNotes ? 'CFMS Bulk Bill Status Report — With Full Notes' : 'CFMS Bulk Bill Status Report', M, y)
      y += 20

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(110, 110, 120)
      const stamp = `Generated: ${new Date().toLocaleString()}`
      doc.text(stamp, M, y)
      y += 12
      doc.text(`Total bills: ${response.results.length}`, M, y)
      y += 18

      // ── Summary line (counts by verdict) ──
      const summaryParts = Object.entries(response.summary.byVerdict).map(
        ([v, n]) => `${n} ${VERDICT_LABEL[v] || v}`
      )
      if (summaryParts.length) {
        doc.setDrawColor(225, 225, 235)
        doc.setFillColor(245, 245, 250)
        const sumText = summaryParts.join('    •    ')
        const sumLines = doc.splitTextToSize(sumText, CONTENT_W - 16)
        const boxH = sumLines.length * 12 + 12
        ensureSpace(boxH)
        doc.roundedRect(M, y, CONTENT_W, boxH, 4, 4, 'FD')
        doc.setTextColor(70, 70, 90)
        doc.setFontSize(9)
        doc.text(sumLines, M + 8, y + 14)
        y += boxH + 16
      }

      // ── Per-bill blocks ──
      const fieldRow = (label: string, value: string) => {
        const labelW = 110
        const valLines = doc.splitTextToSize(value || '—', CONTENT_W - labelW - 16)
        const rowH = Math.max(14, valLines.length * 12)
        ensureSpace(rowH)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(120, 120, 130)
        doc.text(label.toUpperCase(), M + 8, y + 10)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(35, 35, 45)
        doc.text(valLines, M + 8 + labelW, y + 10)
        y += rowH
      }

      response.results.forEach((r, idx) => {
        const prob = r.problemNotes && r.problemNotes.length > 0 ? r.problemNotes[0] : null
        const flagged = r.verdict === 'NOTE_FLAGGED_RETURN' || !!prob

        // Block header height estimate (so we don't split a header from its body)
        ensureSpace(60)

        // Header bar
        doc.setFillColor(flagged ? 253 : 244, flagged ? 242 : 244, flagged ? 245 : 250)
        doc.setDrawColor(flagged ? 244 : 220, flagged ? 200 : 220, flagged ? 210 : 230)
        doc.roundedRect(M, y, CONTENT_W, 26, 4, 4, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(30, 30, 45)
        doc.text(`${idx + 1}.  ${r.billNumber}`, M + 8, y + 17)
        // Verdict on the right
        const verdictText = VERDICT_LABEL[r.verdict] || r.verdict
        doc.setFontSize(9)
        doc.setTextColor(flagged ? 180 : 90, flagged ? 40 : 90, flagged ? 60 : 110)
        const vW = doc.getTextWidth(verdictText)
        doc.text(verdictText, M + CONTENT_W - vW - 8, y + 17)
        y += 32

        // Fields
        if (r.userDescription) fieldRow('Description', r.userDescription)
        fieldRow('Status', r.billStatus || '—')
        fieldRow('Net Amount', r.netAmount ? `Rs. ${r.netAmount}` : '—')
        fieldRow('Beneficiary', r.beneficiaryName || '—')
        fieldRow('Pending At', r.pendingAt ? `${r.pendingAt}${r.pendingAction ? ' · ' + r.pendingAction : ''}` : '—')
        fieldRow('Payment', r.paymentStatus || '—')

        // Flagged note callout
        if (prob) {
          const noteText = `"${prob.remark}"`
          const byText = `— ${prob.author}${prob.date ? ' · ' + prob.date : ''}`
          const noteLines = doc.splitTextToSize(noteText, CONTENT_W - 20)
          const calloutH = 16 + noteLines.length * 11 + 14
          ensureSpace(calloutH + 6)
          doc.setFillColor(253, 240, 243)
          doc.setDrawColor(240, 180, 195)
          doc.roundedRect(M + 8, y, CONTENT_W - 16, calloutH, 3, 3, 'FD')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(190, 40, 70)
          doc.text(`[!] ${prob.problemLabel || 'Flagged'}`, M + 16, y + 13)
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.setTextColor(120, 40, 55)
          doc.text(noteLines, M + 16, y + 26)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(150, 90, 100)
          doc.text(byText, M + 16, y + 26 + noteLines.length * 11 + 4)
          y += calloutH + 6
        }

        // ── Full notes history (only for the "PDF with Notes" export) ──
        // Shows every note from every person on the bill, oldest -> newest, so
        // the reader sees the complete comment/approval trail. Continuous flow;
        // a note that would overflow the page wraps onto the next page.
        if (includeNotes) {
          const allNotes = Array.isArray(r.notes) ? r.notes.slice() : []
          // notes arrive newest-first (sorted by seq desc); show oldest-first
          // so the history reads top-to-bottom in chronological order.
          allNotes.sort((a: any, b: any) => (a?.seq ?? 0) - (b?.seq ?? 0))

          // Section heading
          ensureSpace(20)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(120, 120, 130)
          doc.text(`NOTES HISTORY (${allNotes.length})`, M + 8, y + 10)
          y += 16

          if (allNotes.length === 0) {
            ensureSpace(14)
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(9)
            doc.setTextColor(150, 150, 160)
            doc.text('No notes recorded for this bill.', M + 12, y + 9)
            y += 16
          } else {
            allNotes.forEach((note: any, nIdx: number) => {
              const author = (note?.author || 'Unknown').toString()
              const date = (note?.date || '').toString()
              const remark = (note?.remark || '').toString()
              const isProblem = !!note?.problemLabel

              const header = `${nIdx + 1}. ${author}${date ? '  ·  ' + date : ''}`
              const headerLines = doc.splitTextToSize(header, CONTENT_W - 24)
              const remarkLines = doc.splitTextToSize(remark || '—', CONTENT_W - 24)
              const blockH = headerLines.length * 11 + remarkLines.length * 11 + 12

              ensureSpace(blockH + 4)

              // subtle card behind each note; pink tint if this note is a problem
              doc.setFillColor(isProblem ? 253 : 248, isProblem ? 242 : 248, isProblem ? 245 : 252)
              doc.setDrawColor(isProblem ? 244 : 228, isProblem ? 200 : 228, isProblem ? 210 : 236)
              doc.roundedRect(M + 8, y, CONTENT_W - 16, blockH, 3, 3, 'FD')

              // author · date
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(8.5)
              doc.setTextColor(isProblem ? 175 : 70, isProblem ? 45 : 70, isProblem ? 65 : 90)
              doc.text(headerLines, M + 16, y + 12)

              // problem label (if any)
              let ry = y + 12 + headerLines.length * 11
              if (isProblem) {
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(8)
                doc.setTextColor(190, 40, 70)
                doc.text(`[!] ${note.problemLabel}`, M + 16, ry)
                ry += 10
              }

              // remark text
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9)
              doc.setTextColor(45, 45, 55)
              doc.text(remarkLines, M + 16, ry)

              y += blockH + 4
            })
          }
          y += 2
        }

        // Divider
        y += 6
        doc.setDrawColor(230, 230, 238)
        doc.line(M, y, M + CONTENT_W, y)
        y += 12
      })

      // ── Footer page numbers ──
      const pageCount = doc.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 160)
        doc.text(`Page ${p} of ${pageCount}`, PAGE_W - M - 50, PAGE_H - 20)
        doc.text('cfmsbillsstatus.online', M, PAGE_H - 20)
      }

      const suffix = includeNotes ? '-with-notes' : ''
      doc.save(`cfms-bills-${new Date().toISOString().slice(0, 10)}${suffix}.pdf`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate PDF')
    }
  }

  // The two buttons: plain report, and report + full notes history.
  async function exportPDF() {
    if (!response) return
    setExportingPdf(true)
    try { await generatePDF(false) } finally { setExportingPdf(false) }
  }
  async function exportPDFWithNotes() {
    if (!response) return
    setExportingPdfNotes(true)
    try { await generatePDF(true) } finally { setExportingPdfNotes(false) }
  }

  // ─── Helpers ───
  const formatRelative = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
  }

  // mm:ss for the live elapsed timer (industry-standard elapsed format).
  const formatElapsed = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const Backdrop = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-0 transition-opacity duration-300 md:hidden ${
        isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsSidebarOpen(false)}
    />
  )

  return (
    <>
      <Head>
        <title>Bulk Bill Status Checker — CFMS Bills Status Andhra Pradesh</title>
        <meta
          name="description"
          content="Check multiple AP CFMS bills at once. Bulk treasury bill status checker — paste up to 30 bill numbers and get instant status, payment details, and RBI reference. Save batches and re-run daily."
        />
        <meta
          name="keywords"
          content="bulk CFMS bill check, multiple AP bills status, batch treasury bill status, CFMS bulk search, daily bill tracking"
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/bulk-check" />
      </Head>

      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 flex flex-col items-center relative"
        style={{ minHeight: '100dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <AccountBar />
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 w-full flex-1 px-4 py-8" style={{ minHeight: '100dvh' }}>
          <div className="w-full max-w-4xl mx-auto">

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
                Bulk Bill Status Checker
              </h1>
              <p className="mt-2 text-indigo-200/70 text-xs sm:text-sm">
                Check up to 30 CFMS bills at once · Save daily batches · Re-run with one click
              </p>
              <div className="mt-3 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
              <Link
                href="/"
                className="inline-block mt-4 text-xs text-indigo-300/80 hover:text-indigo-200 underline underline-offset-4"
              >
                ← Single bill search
              </Link>
            </motion.div>

            <Backdrop />

            {/* Privacy notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 bg-amber-500/10 border border-amber-400/20 backdrop-blur-sm rounded-xl p-3 text-xs text-amber-100/90"
            >
              <strong className="text-amber-200">Privacy:</strong> Your CFMS credentials are sent over HTTPS, used once to fetch bill data, and discarded. They are never stored or logged.{' '}
              <Link href="/privacy-policy" className="underline text-amber-200 hover:text-white">
                Read more
              </Link>
            </motion.div>

            {/* Form card */}
            <motion.form
              onSubmit={handleCheck}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-2xl border border-white/20 space-y-4"
            >
              {/* Credentials */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-indigo-200/70 mb-1.5">Username</label>
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your CFMS user ID"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-indigo-200/70 mb-1.5">Password</label>
                  <div className="relative">
                  <input
                      type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-11"
                    disabled={loading}
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={loading}
                      className="absolute inset-y-0 right-3 flex items-center justify-center text-indigo-300 hover:text-white transition disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Batch name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-indigo-200/70 mb-1.5">
                  Batch name <span className="text-indigo-300/50 normal-case">(optional — for history)</span>
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Daily Salary Bills, March Contractor Bills"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Bill numbers */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-indigo-200/70 mb-1.5">
                  Bill numbers <span className="text-indigo-300/50 normal-case">(one per line, up to 30)</span>
                </label>
                <textarea
                  ref={billsTextRef}
                  value={billsText}
                  onChange={(e) => setBillsText(e.target.value)}
                  placeholder={'20264661619 - Salary bill April 2026\n20264644399 - Salary bill April 2026\n2026-418738 - Contractor payment'}
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  disabled={loading}
                />
                <div className="text-xs text-indigo-300/50 mt-1.5 space-y-0.5">
                  <div>
                    Bill formats: <code className="bg-white/5 px-1.5 py-0.5 rounded">2025-2445876</code>{' '}
                    <code className="bg-white/5 px-1.5 py-0.5 rounded">20264581399</code>
                  </div>
                  <div>
                    Tip: add a description after the bill — <code className="bg-white/5 px-1.5 py-0.5 rounded">20264661619 - Salary bill</code>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-w-[160px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Checking…
                    </>
                  ) : (
                    'Check All Bills'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setBillsText(''); setBatchName(''); setResponse(null); setError(null) }}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-100 border border-white/10 transition disabled:opacity-50"
                >
                  Clear
                </button>
                {response && (
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-100 border border-white/10 transition flex items-center gap-2"
                  >
                    <FaFileDownload /> CSV
                  </button>
                )}
                {response && (
                  <button
                    type="button"
                    onClick={exportPDF}
                    disabled={exportingPdf}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-100 border border-white/10 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {exportingPdf ? (
                      <><FaSpinner className="animate-spin" /> PDF…</>
                    ) : (
                      <><FaFileDownload /> PDF</>
                    )}
                  </button>
                )}
                {response && (
                  <button
                    type="button"
                    onClick={exportPDFWithNotes}
                    disabled={exportingPdfNotes}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-100 border border-white/10 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                    title="Download a PDF that includes every note from every person on each bill (full history)"
                  >
                    {exportingPdfNotes ? (
                      <><FaSpinner className="animate-spin" /> PDF + Notes…</>
                    ) : (
                      <><FaFileDownload /> PDF with Notes</>
                    )}
                  </button>
                )}
                {(() => {
                  if (!response) return null
                  const failedCount = response.results.filter(isRetryable).length
                  if (failedCount === 0) return null
                  return (
                    <button
                      type="button"
                      onClick={retryAllFailed}
                      disabled={retryingAll || loading}
                      className="px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 border border-amber-400/40 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                      title="Re-check the bills that couldn't be fetched"
                    >
                      {retryingAll ? (
                        <><FaSpinner className="animate-spin" /> Retrying {failedCount}…</>
                      ) : (
                        <><FaRedo /> Retry {failedCount} Failed</>
                      )}
                    </button>
                  )
                })()}
              </div>

              {/* Progress */}
              {loading && (
                <div className="pt-1">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Live elapsed timer + soft estimate */}
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FaSpinner className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                      <span className="text-sm text-indigo-100 font-medium tabular-nums">
                        {formatElapsed(elapsed)}
                      </span>
                      <span className="text-xs text-indigo-300/50">elapsed</span>
                    </div>
                    {(() => {
                      const n = parseBills(billsText).length
                      // Direct-HTTP path: ~1s/bill + small base. Extra headroom
                      // because slow CFMS responses may trigger auto-retries.
                      const est = Math.max(3, Math.ceil(3 + n * 1.5))
                      return (
                        <span className="text-xs text-indigo-300/50">
                          estimated ~{est}s for {n} {n === 1 ? 'bill' : 'bills'}
                        </span>
                      )
                    })()}
                  </div>

                  {/* Phased status message — reflects that slow batches trigger
                      backend retries, so users understand the wait instead of
                      thinking it's frozen. Driven by elapsed time. */}
                  {(() => {
                    let msg = 'Checking your bills on the CFMS portal…'
                    if (elapsed >= 40) {
                      msg = 'CFMS is slow to respond — automatically retrying to fetch complete data. Please wait…'
                    } else if (elapsed >= 20) {
                      msg = 'CFMS is responding slowly. Still working on your bills…'
                    }
                    return (
                      <p className="text-[11px] text-purple-200/70 mt-2 leading-snug">
                        {msg}
                      </p>
                    )
                  })()}

                  {/* Honest note about variability */}
                  <p className="text-[11px] text-indigo-300/45 mt-2 leading-snug">
                    Actual time depends on the CFMS portal&rsquo;s response speed, which can vary.
                    Some bills may be retried automatically to get complete results.
                    Please keep this tab open while we fetch your results.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </motion.form>

            {/* v4.0: server-load notice. A long wait is now explainable —
                the backend reports how many checks are queued — so we say so
                rather than leaving the user with a bare spinner. */}
            {(loading || retryingAll) && serverQueued > 0 && (
              <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100 flex items-start gap-2">
                <FaInfoCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  The server is busy — {serverQueued}{' '}
                  {serverQueued === 1 ? 'other check is' : 'other checks are'} queued.
                  Your results will still arrive; this may just take a little longer.
                </span>
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-2xl border border-white/20"
                >
                  <h2 className="text-lg font-bold text-indigo-100 mb-4">Results</h2>

                  {/* Summary pills */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {/* v4.0: bills answered from the server's recent-results
                        cache cost no CFMS round-trip, so they come back
                        instantly. Showing the count makes the speed-up
                        visible instead of mysterious. */}
                    {!!response.cachedCount && response.cachedCount > 0 && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs bg-sky-500/20 text-sky-200 border-sky-400/30">
                        <FaBolt className="w-3 h-3" />
                        <span className="font-bold">{response.cachedCount}</span>
                        <span>instant (recent result)</span>
                      </div>
                    )}
                    {Object.entries(response.summary.byVerdict).map(([v, n]) => (
                      <div
                        key={v}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${VERDICT_PILL[v] || VERDICT_PILL.UNKNOWN}`}
                      >
                        {VERDICT_ICON[v]}
                        <span className="font-bold">{n}</span>
                        <span>{VERDICT_LABEL[v] || v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Result cards (mobile-friendly) */}
                  <div className="space-y-3">
                    {response.results.map((r) => {
                      const stage = r.pendingAt
                        ? `${r.pendingAt}${r.pendingAction ? ' · ' + r.pendingAction : ''}`
                        : null
                      // Cached rows are minutes old, not seconds. Say so, so
                      // nobody mistakes a recent result for a live read.
                      const cachedHint = r.fromCache
                        ? 'Recent result (checked within the last few minutes). Use Retry for a live read.'
                        : null
                      const isOpen = expanded[r.billNumber]
                      return (
                        <motion.div
                          key={r.billNumber}
                          layout
                          className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-sm text-indigo-100 font-medium">{r.billNumber}</div>
                                {r.userDescription && (
                                  <div className="text-xs text-purple-200/90 mt-1 leading-snug">
                                    {r.userDescription}
                                  </div>
                                )}
                                {r.beneficiaryName && (
                                  <div className="text-xs text-indigo-300/70 mt-0.5 truncate">
                                    Beneficiary: {r.beneficiaryName}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${VERDICT_PILL[r.verdict] || VERDICT_PILL.UNKNOWN}`}
                                  title={VERDICT_REASON[r.verdict] || undefined}
                                >
                                  {VERDICT_ICON[r.verdict]}
                                  {VERDICT_LABEL[r.verdict] || r.verdict}
                                </span>
                                {VERDICT_REASON[r.verdict] && (
                                  <FaInfoCircle
                                    className="w-3.5 h-3.5 text-indigo-300/60 cursor-help flex-shrink-0"
                                    title={VERDICT_REASON[r.verdict]}
                                  />
                                )}
                                {cachedHint && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-sky-400/30 bg-sky-500/15 text-sky-200 cursor-help flex-shrink-0"
                                    title={cachedHint}
                                  >
                                    <FaBolt className="w-2.5 h-2.5" />
                                    recent
                                  </span>
                                )}
                                {cachedHint && !isRetryable(r) && (
                                  <button
                                    onClick={() => retryBill(r.billNumber)}
                                    disabled={!!retryingBills[r.billNumber] || retryingAll}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-indigo-200 hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-wait"
                                    title="Fetch this bill live from CFMS"
                                  >
                                    {retryingBills[r.billNumber]
                                      ? <FaSpinner className="w-3 h-3 animate-spin" />
                                      : <FaRedo className="w-3 h-3" />}
                                    Refresh
                                  </button>
                                )}
                                {isRetryable(r) && (
                                  <button
                                    onClick={() => retryBill(r.billNumber)}
                                    disabled={!!retryingBills[r.billNumber] || retryingAll}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-indigo-400/40 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25 transition disabled:opacity-60 disabled:cursor-wait"
                                    title="Check this bill again"
                                  >
                                    {retryingBills[r.billNumber] ? (
                                      <>
                                        <FaSpinner className="w-3 h-3 animate-spin" /> Retrying…
                                      </>
                                    ) : (
                                      <>
                                        <FaHistory className="w-3 h-3" /> Retry
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* ── Failure reason line (clear message instead of a bare code) ── */}
                            {VERDICT_REASON[r.verdict] && (
                              <div className={`mt-3 rounded-lg border p-3 text-xs leading-snug flex items-start gap-2 ${
                                r.verdict === 'NOT_FOUND'
                                  ? 'border-slate-400/30 bg-slate-500/10 text-slate-200'
                                  : r.verdict === 'AUTH_FAILED'
                                  ? 'border-red-400/30 bg-red-500/10 text-red-200'
                                  : 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                              }`}>
                                <FaInfoCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-80" />
                                <span>{VERDICT_REASON[r.verdict]}</span>
                              </div>
                            )}

                            {/* ── Problem-note warning (auditor flagged a return / objection) ── */}
                            {r.hasNoteWarning && r.problemNotes && r.problemNotes.length > 0 && (
                              <div className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3">
                                {r.problemNotes.map((note, i) => (
                                  <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-rose-400/20' : ''}>
                                    <div className="flex items-center gap-1.5 text-rose-200 text-xs font-semibold">
                                      <FaExclamationTriangle className="w-3 h-3 flex-shrink-0" />
                                      {note.problemLabel}
                                    </div>
                                    <div className="text-[13px] text-rose-50/90 mt-1 leading-snug">
                                      “{note.remark}”
                                    </div>
                                    <div className="text-[11px] text-rose-200/60 mt-1">
                                      — {note.author}{note.date ? ` · ${note.date}` : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
                              <div>
                                <div className="text-indigo-300/50 uppercase tracking-wider">Status</div>
                                <div className="text-indigo-100 mt-0.5">{r.billStatus || '—'}</div>
                              </div>
                              <div>
                                <div className="text-indigo-300/50 uppercase tracking-wider">Net</div>
                                <div className="text-indigo-100 mt-0.5 tabular-nums">{r.netAmount ? `₹${r.netAmount}` : '—'}</div>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-indigo-300/50 uppercase tracking-wider">Pending at</div>
                                <div className="text-indigo-100 mt-0.5">{stage || '—'}</div>
                              </div>
                              {r.paymentStatus && (
                                <div className="col-span-2 sm:col-span-3">
                                  <div className="text-indigo-300/50 uppercase tracking-wider">Payment</div>
                                  <div className="text-indigo-100 mt-0.5">
                                    {r.paymentStatus}
                                    {r.paymentDate && r.paymentDate !== '00.00.0000' && (
                                      <span className="text-indigo-300/60"> · {r.paymentDate}</span>
                                    )}
                                    {r.paymentRef && (
                                      <div className="text-indigo-300/60 font-mono text-[11px] mt-0.5">{r.paymentRef}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {r.error && (
                                <div className="col-span-2 sm:col-span-3">
                                  <div className="text-red-300/70 uppercase tracking-wider">Error</div>
                                  <div className="text-red-200 mt-0.5 text-[11px]">{r.error}</div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => setExpanded((e) => ({ ...e, [r.billNumber]: !e[r.billNumber] }))}
                              className="mt-3 text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition"
                            >
                              {isOpen ? <FaChevronUp className="w-2.5 h-2.5" /> : <FaChevronDown className="w-2.5 h-2.5" />}
                              {isOpen ? 'Hide raw' : 'View raw'}
                            </button>
                          </div>

                          {isOpen && (
                            <div className="border-t border-white/10 bg-black/20 p-4">
                              <pre className="text-[11px] text-indigo-200/80 whitespace-pre-wrap break-words max-h-80 overflow-y-auto custom-scrollbar font-mono">
                                {JSON.stringify(r, null, 2)}
                              </pre>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  <p className="text-xs text-indigo-300/40 mt-4 text-center">
                    Checked at {new Date(response.checkedAt).toLocaleString()}
                    {!!response.elapsedSeconds && ` · ${response.elapsedSeconds}s`}
                    {!!response.queueWaitMs && response.queueWaitMs > 1500 &&
                      ` · waited ${(response.queueWaitMs / 1000).toFixed(0)}s in queue`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full mt-8 text-center text-xs text-indigo-200/50 space-y-2"
            >
              <p>© 2026 Vishnu Thulasi <br /> This website was designed by Vishnu Thulasi</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link href="/" className="hover:text-indigo-300 underline underline-offset-2">Home</Link>
                <span className="text-indigo-200/20">·</span>
                <Link href="/about" className="hover:text-indigo-300 underline underline-offset-2">About</Link>
                <span className="text-indigo-200/20">·</span>
                <Link href="/privacy-policy" className="hover:text-indigo-300 underline underline-offset-2">Privacy</Link>
              </div>
            </motion.div>

          </div>
        </div>

        {/* History sidebar */}
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%' }}
          animate={{ x: isSidebarOpen ? 0 : '100%' }}
          className={`fixed right-0 top-0 bg-gradient-to-b from-indigo-900/95 to-violet-900/95 backdrop-blur-xl p-5 rounded-l-2xl shadow-2xl border-l border-white/10 z-20 ${
            isDesktop ? 'w-[420px]' : 'w-[90vw] max-w-sm'
          }`}
          style={{
            height: '100dvh',
            paddingTop: 'max(20px, env(safe-area-inset-top))',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-300 flex items-center gap-2">
              <FaHistory className="text-purple-300" /> Saved Batches
            </h2>
            <button
              className="text-white/60 hover:text-white transition p-1 rounded-full hover:bg-white/10"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {historyLoading && history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-200/60">
              <FaSpinner className="w-8 h-8 mb-3 animate-spin opacity-60" />
              <p className="text-sm">Loading your batches…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-200/60">
              <FaHistory className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-base">No saved batches yet</p>
              <p className="text-xs mt-1 text-indigo-200/40 text-center px-4">
                Each batch you run is saved here. Click <FaPlay className="inline w-2.5 h-2.5" /> to re-run any batch.
              </p>
            </div>
          ) : (
            <ul
              className="space-y-3 overflow-y-auto pr-1 custom-scrollbar"
              style={{ maxHeight: 'calc(100dvh - 120px)' }}
            >
              {history.map((batch, idx) => (
                <motion.li
                  key={batch.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group bg-white/5 px-3 py-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
                >
                  {/* Name row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {editingId === batch.id ? (
                      <input
                        type="text"
                        defaultValue={batch.name}
                        onBlur={(e) => { renameBatch(batch.id, e.target.value.trim() || batch.name); setEditingId(null) }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameBatch(batch.id, (e.target as HTMLInputElement).value.trim() || batch.name)
                            setEditingId(null)
                          }
                        }}
                        autoFocus
                        className="text-sm text-white bg-white/10 px-2 py-1 border border-white/20 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(batch.id)}
                        className="text-sm text-indigo-100 hover:text-white text-left font-medium flex-1 truncate"
                        title="Click to rename"
                      >
                        {batch.name}
                      </button>
                    )}
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="text-red-400/70 hover:text-red-300 transition p-1 rounded hover:bg-white/5 flex-shrink-0"
                      title="Delete batch"
                    >
                      <FaRegTrashAlt className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Meta */}
                  <div className="text-xs text-indigo-300/60 mb-2 flex items-center gap-2 flex-wrap">
                    <span>{batch.bills.length} bills</span>
                    {batch.lastRunAt && (
                      <>
                        <span className="text-indigo-200/20">·</span>
                        <span>last run {formatRelative(batch.lastRunAt)}</span>
                      </>
                    )}
                    <span className="text-indigo-200/20">·</span>
                    {batch.source === 'local' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-200/70" title="Saved only on this device — log in to sync">
                        <FaHistory className="w-2 h-2" /> On this device
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-200/80" title="Saved to your account — available on all your devices">
                        <FaCheckCircle className="w-2 h-2" /> Synced to account
                      </span>
                    )}
                  </div>

                  {/* Last summary chips */}
                  {batch.lastSummary && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(batch.lastSummary).map(([v, n]) => (
                        <span
                          key={v}
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${VERDICT_PILL[v] || VERDICT_PILL.UNKNOWN}`}
                          title={VERDICT_LABEL[v] || v}
                        >
                          {n} {VERDICT_LABEL[v] || v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => rerunBatch(batch)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition"
                    >
                      <FaPlay className="w-2.5 h-2.5" /> Re-run
                    </button>
                    <button
                      onClick={() => loadBatch(batch)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-indigo-200 text-xs py-1.5 rounded-lg border border-white/10 transition"
                    >
                      Load only
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Floating history button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed right-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-xl z-10 transition-all ring-2 ring-white/20 ${
            isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ top: 'max(16px, env(safe-area-inset-top))' }}
          onClick={() => setIsSidebarOpen(true)}
        >
          <FaHistory className="w-5 h-5 sm:w-6 sm:h-6" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-violet-900">
              {history.length}
            </span>
          )}
        </motion.button>

        <style jsx>{`
          @keyframes blob {
            0%   { transform: translate(0px, 0px) scale(1); }
            33%  { transform: translate(30px, -50px) scale(1.1); }
            66%  { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
        `}</style>
      </main>
    </>
  )
}

export default function BulkCheckPage() {
  return (
    <RequireAuth>
      <BulkCheck />
    </RequireAuth>
  )
}
