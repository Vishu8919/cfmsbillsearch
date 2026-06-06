// src/pages/bulk-check.tsx
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import RequireAuth from '../components/RequireAuth'
import AccountBar from '../components/AccountBar'
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
} from 'react-icons/fa'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'

// ───── Types ─────
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
  ERROR: 'Error',
  AUTH_FAILED: 'Auth Failed',
  PAGE_LOAD_FAILED: 'Page Failed',
  UNKNOWN: 'Unknown',
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
  ERROR: 'bg-red-500/20 text-red-200 border-red-400/30',
  AUTH_FAILED: 'bg-red-500/20 text-red-200 border-red-400/30',
  PAGE_LOAD_FAILED: 'bg-red-500/20 text-red-200 border-red-400/30',
  UNKNOWN: 'bg-white/10 text-indigo-200 border-white/10',
}

const VERDICT_ICON: Record<string, React.ReactNode> = {
  PAID: <FaCheckCircle className="w-3 h-3" />,
  APPROVED_PAYMENT_PENDING: <FaClock className="w-3 h-3" />,
  APPROVED: <FaCheckCircle className="w-3 h-3" />,
}

const STORAGE_KEY = 'bulkBillHistory'
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
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // ─── History state ───
  const [history, setHistory] = useState<BatchHistoryItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const billsTextRef = useRef<HTMLTextAreaElement>(null)

  // ─── Load history on mount ───
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setHistory(parsed)
        else {
          localStorage.removeItem(STORAGE_KEY)
          setHistory([])
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
    }
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

  function saveHistory(next: BatchHistoryItem[]) {
    setHistory(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
      const res = await fetch(`${API_URL}/api/check-bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, billNumbers: bills }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setResponse(data)
      setProgress(100)

      // ─── Save / update batch history ───
      const summary = data.summary?.byVerdict || {}
      if (batchIdOverride) {
        // Update existing batch's lastRunAt + lastSummary
        const next = history.map((b) =>
          b.id === batchIdOverride
            ? { ...b, lastRunAt: Date.now(), lastSummary: summary, bills }
            : b
        )
        saveHistory(next)
      } else {
        // Save as a new batch
        const newItem: BatchHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: batchName.trim() || `Batch of ${bills.length} bills`,
          bills,
          createdAt: Date.now(),
          lastRunAt: Date.now(),
          lastSummary: summary,
        }
        const next = [newItem, ...history].slice(0, MAX_HISTORY)
        saveHistory(next)
        setBatchName('')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setError(msg)
    } finally {
      setLoading(false)
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
    saveHistory(history.filter((b) => b.id !== id))
  }

  function renameBatch(id: string, newName: string) {
    saveHistory(history.map((b) => (b.id === id ? { ...b, name: newName } : b)))
  }

  // ─── Export CSV ───
  function exportCSV() {
    if (!response) return
    const headers = [
      'Bill Number', 'Description', 'Verdict', 'Bill Status',
      'Pending At', 'Pending Action', 'Net Amount',
      'Beneficiary', 'Payment Status', 'Payment Ref', 'Payment Date',
    ]
    const rows = response.results.map((r) => [
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
    ])
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

  // ─── Helpers ───
  const formatRelative = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
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
                  <p className="text-xs text-indigo-300/60 mt-2">
                    Authenticating and reading {parseBills(billsText).length} bills… (~{Math.max(8, Math.ceil(parseBills(billsText).length * 4))}s)
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
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${VERDICT_PILL[r.verdict] || VERDICT_PILL.UNKNOWN}`}>
                                {VERDICT_ICON[r.verdict]}
                                {VERDICT_LABEL[r.verdict] || r.verdict}
                              </span>
                            </div>

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

          {history.length === 0 ? (
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
