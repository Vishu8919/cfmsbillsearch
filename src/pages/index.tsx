import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { FaRegTrashAlt, FaTimes, FaHistory, FaLock } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { FaPaste } from 'react-icons/fa'
import AccountBar from '../components/AccountBar'
import LockedHistoryNotice from '../components/LockedHistoryNotice'
import { useAuth } from '../context/AuthContext'
import {
  listSavedBills,
  saveSavedBill,
  renameSavedBill,
  deleteSavedBill,
  migrateSavedBills,
  CloudSavedBill,
} from '../lib/auth'

interface BillHistoryItem {
  year: string
  billNo: string
  timestamp: number
  name: string
  cloudId?: string  // server id when synced; absent for local-only items
}

function Home() {
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [billNo, setBillNo] = useState('')
  const [history, setHistory] = useState<BillHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { user } = useAuth()

  // Update state + mirror to localStorage (cache / logged-out store).
  const saveLocal = (next: BillHistoryItem[]) => {
    setHistory(next)
    try { localStorage.setItem('billHistory', JSON.stringify(next)) } catch {}
  }
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const billNoInputRef = useRef<HTMLInputElement>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [fullBill, setFullBill] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handlePasteClick = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API not available')
      const text = await navigator.clipboard.readText()
      setFullBill(text)
      inputRef.current?.focus()
    } catch (err) {
      console.error('Failed to paste:', err)
      alert("Couldn't access clipboard. Please paste manually.")
    }
  }

  // Add a searched bill to history (dedupe by year+billNo). Mirrors locally
  // and, when logged in, syncs to the cloud.
  const addToHistory = (y: string, b: string) => {
    const ts = Date.now()
    const without = history.filter((h) => !(h.year === y && h.billNo === b))
    const newItem: BillHistoryItem = { year: y, billNo: b, timestamp: ts, name: '' }
    const next = [newItem, ...without]
    saveLocal(next)
    if (user) {
      saveSavedBill({ year: y, billNo: b, timestamp: ts })
        .then(({ bill }) => {
          // tag the local item with its server id for later edit/delete
          setHistory((prev) => {
            const tagged = prev.map((h) =>
              h.year === y && h.billNo === b ? { ...h, cloudId: bill.id } : h
            )
            try { localStorage.setItem('billHistory', JSON.stringify(tagged)) } catch {}
            return tagged
          })
        })
        .catch(() => { /* keep local copy if cloud save fails */ })
    }
  }

  const handleSearch = () => {
    if (fullBill.trim()) {
      let yearPart: string
      let billNoPart: string
      const trimmed = fullBill.trim()
      if (trimmed.includes('-')) {
        const parts = trimmed.split('-').map((p) => p.trim())
        yearPart = parts[0]
        billNoPart = parts[1]
      } else {
        yearPart = trimmed.slice(0, 4)
        billNoPart = trimmed.slice(4)
      }
      if (yearPart && billNoPart) {
        setYear(yearPart)
        setBillNo(billNoPart)
        addToHistory(yearPart, billNoPart)
        const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${yearPart}-${billNoPart}`
        window.open(url, '_blank')
        setFullBill('')
        return
      }
    }
    if (year && billNo) {
      addToHistory(year, billNo)
      const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${year}-${billNo}`
      window.open(url, '_blank')
      setBillNo('')
    }
  }

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    let cancelled = false

    const readLocal = (): BillHistoryItem[] => {
      try {
        const stored = localStorage.getItem('billHistory')
        if (!stored) return []
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    const toLocalShape = (b: CloudSavedBill): BillHistoryItem => ({
      year: b.year, billNo: b.billNo, name: b.name || '', timestamp: b.timestamp, cloudId: b.id,
    })

    async function load() {
      const local = readLocal()

      // Show cached local history IMMEDIATELY (never blank while fetching).
      if (local.length > 0 && !cancelled) setHistory(local)

      // Logged out → local history is all we have.
      if (!user) {
        if (!cancelled) setHistory(local)
        return
      }

      // Logged in → refresh from cloud in the background and reconcile.
      setHistoryLoading(true)
      try {
        let cloud: CloudSavedBill[]
        if (local.length > 0) {
          const res = await migrateSavedBills(
            local.map((h) => ({ year: h.year, billNo: h.billNo, name: h.name, timestamp: h.timestamp }))
          )
          cloud = res.bills
        } else {
          const res = await listSavedBills()
          cloud = res.bills
        }
        if (cancelled) return
        const mapped = cloud.map(toLocalShape)
        setHistory(mapped)
        try { localStorage.setItem('billHistory', JSON.stringify(mapped)) } catch {}
      } catch {
        // Keep local (already shown) if cloud fails.
        if (!cancelled && local.length === 0) setHistory([])
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node))
        setIsSidebarOpen(false)
    }
    if (isSidebarOpen) document.addEventListener('mousedown', handleClickOutside)
    else document.removeEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen])

  const handleDelete = (index: number) => {
    const target = history[index]
    const updatedHistory = history.filter((_, idx) => idx !== index)
    saveLocal(updatedHistory)
    if (user && target?.cloudId) {
      deleteSavedBill(target.cloudId).catch(() => { /* already removed locally */ })
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedHistory = [...history]
    updatedHistory[index] = { ...updatedHistory[index], name: e.target.value }
    saveLocal(updatedHistory)
    const target = updatedHistory[index]
    if (user && target?.cloudId) {
      renameSavedBill(target.cloudId, e.target.value).catch(() => { /* keep local */ })
    }
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
        <title>CFMS Bills Status Andhra Pradesh</title>
        <meta
          name="description"
          content="Check Andhra Pradesh CFMS bill status online instantly. Search AP treasury payment status, pending bills, and payment releases using bill number. Fast and free CFMS bill tracker."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/" />
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

        <div
          className="relative z-10 w-full flex-1 flex items-center justify-center"
          style={{ minHeight: '100dvh' }}
        >
          <div className="w-full max-w-md mx-auto flex flex-col items-center px-4 py-8">

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-center mb-6"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
                CFMS Bill Status
              </h1>
              <p className="mt-2 text-indigo-200/70 text-xs sm:text-sm">
                CFMS Bills Status Checker AP - Search your bill number
              </p>
              <div className="mt-3 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
            </motion.div>

            <Backdrop />

            {/* Search Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 relative"
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-purple-400/50"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-indigo-400/50"></div>

              {/* Paste full bill */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-indigo-200 mb-1">
                  Enter Full Bill Number
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    value={fullBill}
                    onChange={(e) => setFullBill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder="e.g. 2025-4567894 or 2026456987"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
                  />
                  <button
                    type="button"
                    onClick={handlePasteClick}
                    className="px-4 py-3 bg-indigo-600/60 hover:bg-indigo-500/60 border border-white/20 rounded-xl text-white transition-all flex-shrink-0"
                    title="Paste from clipboard"
                  >
                    <FaPaste />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-indigo-200/50 text-xs">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); handleSearch() }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1">Year</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={year}
                    onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) setYear(e.target.value) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') billNoInputRef.current?.focus() }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
                    placeholder="e.g. 2026"
                    ref={billNoInputRef}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1">Bill Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={billNo}
                    onChange={(e) => { if (/^\d{0,10}$/.test(e.target.value)) setBillNo(e.target.value) }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
                    placeholder="e.g. 2575612"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                  Search Bill
                </button>
              </form>
            </motion.div>

            {/* Bulk check link */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full mt-4"
            >
              <Link
                href={user ? '/bulk-check' : '/login?next=%2Fbulk-check'}
                className="block w-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 text-indigo-100 py-3 rounded-xl text-center text-sm transition-all group"
              >
                <span className="inline-flex items-center gap-2">
                  {!user && <FaLock className="w-3 h-3 text-indigo-300/70" />}
                  Check Multiple Bills at Once
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="text-xs text-indigo-300/60 mt-0.5">
                  {user ? 'Up to 30 bills · Daily batches · CSV export' : 'Log in to check up to 30 bills at once'}
                </div>
              </Link>
            </motion.div>

            {/* Footer links */}
            {/* Footer links */}
<motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full mt-6 text-center text-xs text-indigo-200/50"
            >
              {/* Links row */}
              <div className="flex items-center justify-center">
                <Link
                  href="/about"
                  className="hover:text-indigo-300 transition-colors underline underline-offset-2"
                >
                  About &amp; How to Use
                </Link>

                <span className="mx-3 text-indigo-200/20">•</span>

                <Link
                  href="/privacy-policy"
                  className="hover:text-indigo-300 transition-colors underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
              </div>

              {/* Space between links and footer text */}
              <div className="mt-4" />

              {/* Footer text */}
              <div className="flex items-center justify-center gap-4 flex-wrap text-center">
                <p>
                  © 2026 Vishnu Thulasi <br />
                  This website was designed by Vishnu Thulasi
                </p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Sidebar */}
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%' }}
          animate={{ x: isSidebarOpen ? 0 : '100%' }}
          className={`fixed right-0 top-0 bg-gradient-to-b from-indigo-900/95 to-violet-900/95 backdrop-blur-xl p-5 rounded-l-2xl shadow-2xl border-l border-white/10 z-20 ${
            isDesktop ? 'w-96' : 'w-[85vw] max-w-sm'
          }`}
          style={{
            height: '100dvh',
            paddingTop: 'max(20px, env(safe-area-inset-top))',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-300 flex items-center gap-2">
              <FaHistory className="text-purple-300 flex-shrink-0" /> Previous Bills
            </h2>
            <button
              className="text-white/60 hover:text-white transition p-1 rounded-full hover:bg-white/10"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {!user ? (
            <LockedHistoryNotice />
          ) : historyLoading && history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-200/60">
              <svg className="w-8 h-8 mb-3 animate-spin opacity-60" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="text-sm">Loading your bills…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-200/60">
              <svg className="w-14 h-14 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base">No search history yet</p>
              <p className="text-xs mt-1 text-indigo-200/40">Your searched bills will appear here</p>
            </div>
          ) : (
            <ul
              className="space-y-3 overflow-y-auto pr-1 custom-scrollbar"
              style={{ maxHeight: 'calc(100dvh - 120px)' }}
            >
              {history.map((item, idx) => (
                <motion.li
                  key={`${item.year}-${item.billNo}-${item.timestamp}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group flex items-center justify-between bg-white/5 px-3 py-3 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
                >
                  <div className="flex-1 mr-2 min-w-0">
                    {editingIndex === idx ? (
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleNameChange(e, idx)}
                        onBlur={() => setEditingIndex(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingIndex(null) }}
                        autoFocus
                        className="text-sm text-white bg-white/10 placeholder-indigo-300/50 px-2 py-1 border border-white/20 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter bill name"
                      />
                    ) : (
                      <div className="flex items-center min-w-0 gap-1">
                        <button
                          onClick={() => {
                            const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
                            window.open(url, '_blank')
                          }}
                          className="text-sm text-indigo-100 hover:text-white text-left min-w-0 font-medium truncate"
                          title={item.name || `Bill ${item.year}-${item.billNo}`}
                        >
                          {item.name || 'Unnamed Bill'}
                        </button>
                        <button
                          className="ml-1 text-indigo-300 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-all px-1 py-0.5 rounded hover:bg-white/5 flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); setEditingIndex(idx) }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      className="text-xs font-mono bg-indigo-900/30 px-2 py-1 rounded text-indigo-200 hover:bg-indigo-800/50 transition-colors"
                      onClick={() => {
                        const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
                        window.open(url, '_blank')
                      }}
                    >
                      {item.year}-{item.billNo}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(idx) }}
                      className="text-red-400/80 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-white/5"
                      title="Delete"
                    >
                      <FaRegTrashAlt className="w-3.5 h-3.5" />
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

export default function HomePage() {
  return <Home />
}
