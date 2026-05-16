import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { FaRegTrashAlt, FaTimes, FaHistory } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { FaPaste } from 'react-icons/fa'

// ─── AdSense Ad Unit Component ───────────────────────────────────────────────
// Replace ca-pub-XXXXXXXXXXXXXXXX with your real Publisher ID
// Replace each data-ad-slot with the slot ID from your AdSense account
interface AdUnitProps {
  adSlot: string
  adFormat?: string
  style?: React.CSSProperties
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

function AdUnit({ adSlot, adFormat = 'auto', style }: AdUnitProps) {
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense may fail before script loads — safely ignore
    }
  }, [])

  return (
    <div style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

interface BillHistoryItem {
  year: string
  billNo: string
  timestamp: number
  name: string
}

export default function Home() {
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [billNo, setBillNo] = useState('')
  const [history, setHistory] = useState<BillHistoryItem[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
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

  const handleSearch = () => {
    if (fullBill && fullBill.includes('-')) {
      const [yearPart, billNoPart] = fullBill.split('-').map((p) => p.trim())
      setYear(yearPart)
      setBillNo(billNoPart)
      const newItem = { year: yearPart, billNo: billNoPart, timestamp: Date.now(), name: '' }
      const updatedHistory = [newItem, ...history]
      setHistory(updatedHistory)
      localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
      const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${yearPart}-${billNoPart}`
      window.open(url, '_blank')
      setFullBill('')
      return
    }
    if (year && billNo) {
      const newItem = { year, billNo, timestamp: Date.now(), name: '' }
      const updatedHistory = [newItem, ...history]
      setHistory(updatedHistory)
      localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
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
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('billHistory')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setHistory(parsed)
        else { localStorage.removeItem('billHistory'); setHistory([]) }
      }
    } catch {
      localStorage.removeItem('billHistory')
      setHistory([])
    }
  }, [])

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
    const updatedHistory = history.filter((_, idx) => idx !== index)
    setHistory(updatedHistory)
    localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedHistory = [...history]
    updatedHistory[index].name = e.target.value
    setHistory(updatedHistory)
    localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
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
      {/* ── Per-page SEO Head (page-level title + canonical) ── */}
      <Head>
        <title> CFMS Bills Search Andhra Pradesh </title>
        <meta
          name="description"
          content="Check Andhra Pradesh CFMS bill status online instantly. Search AP treasury payment status, pending bills, and payment releases using bill number. Fast and free CFMS bill tracker."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/bill-search" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* ── Top Banner Ad (shows above the form) ── */}
        {/* Replace 1234567890 with your real ad slot ID */}
        <div className="w-full max-w-2xl mx-auto z-10 mb-4">
          <AdUnit adSlot="1234567890" adFormat="horizontal" style={{ minHeight: 90 }} />
        </div>

        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center z-10">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center mb-8"
          >
            {/* h1 is important for SEO — keep this exact text */}
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
              CFMS Bill Search
            </h1>
            <p className="mt-2 text-indigo-200/70 text-sm">
              Andhra Pradesh CFMS Bills Status Checker - Check your AP treasury bill status instantly by entering the year and bill number.
            </p>
            <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
          </motion.div>

          <Backdrop />

          {/* Bill Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 relative"
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-purple-400/50"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-indigo-400/50"></div>

            {/* Paste full bill field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-indigo-200 mb-1">
                Paste Full Bill Number
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={fullBill}
                  onChange={(e) => setFullBill(e.target.value)}
                  placeholder="e.g. 2025-2575612"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={handlePasteClick}
                  className="px-4 py-3 bg-indigo-600/60 hover:bg-indigo-500/60 border border-white/20 rounded-xl text-white transition-all"
                  title="Paste from clipboard"
                >
                  <FaPaste />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-indigo-200/50 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch()
              }}
              className="space-y-4"
            >
              {/* Year Field */}
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1">Year</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => {
                    if (/^\d{0,4}$/.test(e.target.value)) setYear(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') billNoInputRef.current?.focus()
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. 2025"
                  ref={billNoInputRef}
                />
              </div>

              {/* Bill Number Field */}
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1">
                  Bill Number
                </label>
                <input
                  type="text"
                  value={billNo}
                  onChange={(e) => {
                    if (/^\d{0,10}$/.test(e.target.value)) setBillNo(e.target.value)
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. 2575612"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all mt-6"
              >
                Search Bill
              </button>
            </form>
          </motion.div>

          {/* ── In-Feed / Multiplex Ad (below form) ── */}
          {/* Replace 0987654321 with your real ad slot ID */}
          <div className="w-full mt-6">
            <AdUnit adSlot="0987654321" adFormat="auto" style={{ minHeight: 100 }} />
          </div>

          {/* ── SEO Keyword Content Section ──────────────────────────────────────
               This section is CRITICAL for Google to understand what your page is about.
               It is styled subtly so it doesn't distract users but is fully readable by Google.
          ──────────────────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full mt-8 mb-20 bg-white/5 border border-white/10 rounded-2xl p-6 text-indigo-200/60 text-sm space-y-4"
            aria-label="About CFMS Bill Status Checker"
          >
            <h2 className="text-base font-semibold text-indigo-200/80">
              What is AP CFMS Bill Status?
            </h2>
            <p>
              The <strong className="text-indigo-200/90">Andhra Pradesh CFMS</strong> (Comprehensive
              Financial Management System) is the official treasury system used by the AP state
              government to manage all payments and bills. Using this tool, government employees and
              DDOs can instantly check the <strong className="text-indigo-200/90">CFMS bill status</strong>,
              track pending payments, and view treasury payment releases.
            </p>

            <h2 className="text-base font-semibold text-indigo-200/80">How to Check CFMS Bill Status</h2>
            <ol className="list-decimal list-inside space-y-1 text-indigo-200/60">
              <li>Enter the financial year (e.g. 2025) in the Year field.</li>
              <li>Enter your CFMS bill number in the Bill Number field.</li>
              <li>Click <em>Search Bill</em> — the official CFMS portal will open directly.</li>
              <li>Alternatively, paste your full bill number (format: YYYY-XXXXXXX) in one go.</li>
            </ol>

            <h2 className="text-base font-semibold text-indigo-200/80">About This Tool</h2>
            <p>
              This free tool provides a simplified interface to check{' '}
              <strong className="text-indigo-200/90">AP treasury payment status</strong> and{' '}
              <strong className="text-indigo-200/90">pending bills</strong>. Your search history is
              stored locally on your device. No data is sent to our servers. This is an unofficial
              helper tool and is not affiliated with the Andhra Pradesh government or APCFSS.
            </p>
          </motion.section>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-gray-900/90 to-transparent backdrop-blur-sm text-center text-xs text-indigo-200/60 z-10"
        >
          <div className="container mx-auto px-4">
            <p>© 2026 Vishnu Thulasi</p>
            <p className="mt-1">Website designed by Vishnu Thulasi</p>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%' }}
          animate={{ x: isSidebarOpen ? 0 : '100%' }}
          className={`fixed right-0 top-0 h-full bg-gradient-to-b from-indigo-900/90 to-violet-900/90 backdrop-blur-xl p-5 rounded-l-2xl shadow-2xl border-r border-t border-b border-white/10 z-20 ${
            isDesktop ? 'w-96' : 'w-80'
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-300 flex items-center">
              <FaHistory className="mr-3 text-purple-300" /> Previous Bills
            </h2>
            <button
              className="text-white/60 hover:text-white transition p-1 rounded-full hover:bg-white/10"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-200/60">
              <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No search history yet</p>
              <p className="text-sm mt-1 text-indigo-200/40">Your searched bills will appear here</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-[calc(100vh-150px)] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((item, idx) => (
                <motion.li
                  key={`${item.year}-${item.billNo}-${item.timestamp}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 shadow-sm"
                >
                  <div className="flex-1 mr-3 min-w-0">
                    {editingIndex === idx ? (
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleNameChange(e, idx)}
                        onBlur={() => setEditingIndex(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingIndex(null) }}
                        autoFocus
                        className="text-base text-white bg-white/10 placeholder-indigo-300/50 px-3 py-2 border border-white/20 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter bill name"
                      />
                    ) : (
                      <div className="flex items-center justify-between min-w-0">
                        <button
                          onClick={() => {
                            const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
                            window.open(url, '_blank')
                          }}
                          className="text-base text-indigo-100 hover:text-white text-left min-w-0 font-medium"
                          title={item.name || `Bill ${item.year}-${item.billNo}`}
                        >
                          {item.name || 'Unnamed Bill'}
                        </button>
                        <button
                          className="ml-2 text-indigo-300 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded hover:bg-white/5"
                          onClick={(e) => { e.stopPropagation(); setEditingIndex(idx) }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-xs sm:text-sm font-mono bg-indigo-900/30 px-2 py-1 rounded text-indigo-200 hover:bg-indigo-800/50 transition-colors"
                      onClick={() => {
                        const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
                        window.open(url, '_blank')
                      }}
                    >
                      {item.year}-{item.billNo}
                    </button>
                    <span className="text-xs text-indigo-300/60 hidden sm:inline">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(idx) }}
                      className="text-red-400/80 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-white/5"
                      title="Delete"
                    >
                      <FaRegTrashAlt className="w-4 h-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed top-4 right-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl z-10 transition-all ${
            isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          } hover:shadow-indigo-500/30 ring-2 ring-white/20`}
          onClick={() => setIsSidebarOpen(true)}
        >
          <FaHistory className="w-6 h-6" />
        </motion.button>

        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        `}</style>
      </main>
    </>
  )
}
