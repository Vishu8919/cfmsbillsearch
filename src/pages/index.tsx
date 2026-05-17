import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { FaRegTrashAlt, FaTimes, FaHistory } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { FaPaste } from 'react-icons/fa'

// ─── AdSense Ad Unit Component ───────────────────────────────────────────────
// interface AdUnitProps {
//   adSlot: string
//   adFormat?: string
//   style?: React.CSSProperties
// }

// declare global {
//   interface Window {
//     adsbygoogle?: unknown[]
//   }
// }

// function AdUnit({ adSlot, adFormat = 'auto', style }: AdUnitProps) {
//   useEffect(() => {
//     try {
//       ;(window.adsbygoogle = window.adsbygoogle || []).push({})
//     } catch {
//       // AdSense may fail before script loads — safely ignore
//     }
//   }, [])

//   return (
//     <div style={style}>
//       <ins
//         className="adsbygoogle"
//         style={{ display: 'block' }}
//         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"  // ← replace with your Publisher ID
//         data-ad-slot={adSlot}
//         data-ad-format={adFormat}
//         data-full-width-responsive="true"
//       />
//     </div>
//   )
// }

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
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* ── Three-column layout (desktop: left-ad | center-form | right-ad) ── */}
        <div
          className="relative z-10 w-full flex-1 flex items-center justify-center"
          style={{ minHeight: '100dvh' }}
        >

          {/* ── LEFT AD COLUMN — desktop only ──────────────────────────────────
              Uncomment the AdUnit inside after AdSense is approved.
              Replace SLOT_ID_LEFT with your real vertical ad slot ID.
          ─────────────────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col items-center justify-center w-[160px] xl:w-[200px] flex-shrink-0 self-stretch px-2">
            {/* ── ADSENSE LEFT — uncomment after approval ──
            <AdUnit
              adSlot="SLOT_ID_LEFT"
              adFormat="vertical"
              style={{ width: '160px', minHeight: '600px' }}
            />
            ── END ADSENSE LEFT ── */}
          </div>

          {/* ── CENTER CONTENT COLUMN ─────────────────────────────────────── */}
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
                CFMS Bills Status Checker AP — Search your bill number
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
                    placeholder="e.g. 2026-123456"
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

            {/* ── MOBILE AD — below form, hidden on desktop ─────────────────────
                Best position on mobile: right after the form, before footer.
                Uncomment the AdUnit after AdSense is approved.
                Replace SLOT_ID_MOBILE with your real ad slot ID.
            ──────────────────────────────────────────────────────────────────── */}
            <div className="w-full mt-5 lg:hidden">
              {/* ── ADSENSE MOBILE — uncomment after approval ──
              <AdUnit
                adSlot="SLOT_ID_MOBILE"
                adFormat="auto"
                style={{ minHeight: 100 }}
              />
              ── END ADSENSE MOBILE ── */}
            </div>

            {/* Footer links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full mt-6 text-center text-xs text-indigo-200/50 space-y-2"
            >
              <p>© 2026 Vishnu Thulasi <br /> This website was designed by Vishnu Thulasi</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/about"
                  className="hover:text-indigo-300 transition-colors underline underline-offset-2"
                >
                  About &amp; How to Use
                </Link>
                <span className="text-indigo-200/20">·</span>
                <Link
                  href="/privacy-policy"
                  className="hover:text-indigo-300 transition-colors underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
              </div>
            </motion.div>

          </div>
          {/* ── END CENTER COLUMN ── */}

          {/* ── RIGHT AD COLUMN — desktop only ─────────────────────────────────
              Uncomment the AdUnit inside after AdSense is approved.
              Replace SLOT_ID_RIGHT with your real vertical ad slot ID.
          ──────────────────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col items-center justify-center w-[160px] xl:w-[200px] flex-shrink-0 self-stretch px-2">
            {/* ── ADSENSE RIGHT — uncomment after approval ──
            <AdUnit
              adSlot="SLOT_ID_RIGHT"
              adFormat="vertical"
              style={{ width: '160px', minHeight: '600px' }}
            />
            ── END ADSENSE RIGHT ── */}
          </div>

        </div>
        {/* ── END THREE-COLUMN LAYOUT ── */}

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

          {history.length === 0 ? (
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
