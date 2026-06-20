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
}

type ApiResponse = {
  results: BillResult[]
  checkedAt: string
  elapsedSeconds?: number
  summary: { total: number; byVerdict: Record<string, number> }
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
  UNKNOWN: 'bg-white/10 text-indigo-200 border-white/10',
}

const VERDICT_ICON: Record<string, React.ReactNode> = {
  PAID: <FaCheckCircle className="w-3 h-3" />,
  APPROVED_PAYMENT_PENDING: <FaClock className="w-3 h-3" />,
  APPROVED: <FaCheckCircle className="w-3 h-3" />,
  NOTE_FLAGGED_RETURN: <FaExclamationTriangle className="w-3 h-3" />,
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
      const token = getToken()
      const res = await fetch(`${API_URL}/api/check-bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username, password, billNumbers: bills }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
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
      const res = await fetch(`${API_URL}/api/check-bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({ username, password, billNumbers: [billNumber] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
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
  async function exportPDF() {
    if (!response) return
    setExportingPdf(true)
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
      doc.text('CFMS Bulk Bill Status Report', M, y)
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

      doc.save(`cfms-bills-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate PDF')
    } finally {
      setExportingPdf(false)
    }
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
                      const est = Math.max(10, n * 10)
                      return (
                        <span className="text-xs text-indigo-300/50">
                          estimated ~{est}s for {n} {n === 1 ? 'bill' : 'bills'}
                        </span>
                      )
                    })()}
                  </div>

                  {/* Honest note about variability */}
                  <p className="text-[11px] text-indigo-300/45 mt-2 leading-snug">
                    Actual time depends on the CFMS portal&rsquo;s response speed, which varies.
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
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${VERDICT_PILL[r.verdict] || VERDICT_PILL.UNKNOWN}`}>
                                  {VERDICT_ICON[r.verdict]}
                                  {VERDICT_LABEL[r.verdict] || r.verdict}
                                </span>
                                {r.verdict === 'UNKNOWN' && (
                                  <button
                                    onClick={() => retryBill(r.billNumber)}
                                    disabled={!!retryingBills[r.billNumber]}
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
                    {response.elapsedSeconds && ` · ${response.elapsedSeconds}s`}
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
