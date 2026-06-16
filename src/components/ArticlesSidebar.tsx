// src/components/ArticlesSidebar.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaBookOpen, FaChevronLeft } from 'react-icons/fa'

// All site guides, grouped. Keep in sync with /articles.
const groups: { heading: string; items: { slug: string; title: string }[] }[] = [
  {
    heading: 'Getting Started',
    items: [
      { slug: 'how-to-check-cfms-bill-status', title: 'How to Check Your Bill Status' },
      { slug: 'bulk-cfms-bill-check-guide', title: 'Check Multiple Bills at Once' },
    ],
  },
  {
    heading: 'Understanding Bills',
    items: [
      { slug: 'cfms-bill-status-meaning', title: 'What Each Bill Status Means' },
      { slug: 'why-cfms-bill-rejected', title: 'Why a Bill Gets Rejected' },
      { slug: 'ap-treasury-payment-releases', title: 'AP Treasury Payment Releases' },
      { slug: 'cfms-vs-apcfss-vs-treasury', title: 'CFMS vs APCFSS vs Treasury' },
    ],
  },
  {
    heading: 'Reference',
    items: [
      { slug: 'cfms-object-heads-list', title: 'CFMS Object Heads List' },
      { slug: 'cfms-bill-submission-schedule', title: 'Bill Submission Schedule' },
      { slug: 'cfms-bill-status-faq', title: 'CFMS Bill Status FAQ' },
    ],
  },
  {
    heading: 'For DDOs',
    items: [
      { slug: 'cfms-guide-for-ddos', title: 'CFMS Guide for DDOs' },
      { slug: 'cfms-guide-for-employees', title: 'CFMS Guide for Employees' },
    ],
  },
]

// The inner list, shared by desktop dock and mobile drawer.
function SidebarList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.heading}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300/60 mb-2 px-2">
            {group.heading}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/articles/${item.slug}`}
                  onClick={onNavigate}
                  className="block text-sm text-indigo-100/75 hover:text-white hover:bg-white/10 rounded-lg px-2.5 py-2 transition-all leading-snug"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="pt-2 px-2">
        <Link
          href="/articles"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-white transition-colors"
        >
          View all guides →
        </Link>
      </div>
    </nav>
  )
}

export default function ArticlesSidebar() {
  // Desktop dock open/closed (persisted)
  const [docked, setDocked] = useState(true)
  // Mobile drawer open/closed
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Remember desktop dock preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('articlesSidebarDocked')
      if (saved !== null) setDocked(saved === '1')
    } catch {}
  }, [])
  const toggleDock = (next: boolean) => {
    setDocked(next)
    try {
      localStorage.setItem('articlesSidebarDocked', next ? '1' : '0')
    } catch {}
  }

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [drawerOpen])

  return (
    <>
      {/* ========== DESKTOP DOCK ========== */}
      {/* When docked: show panel. When closed: show a slim reopen tab. */}
      <div className="hidden lg:block flex-shrink-0">
        <AnimatePresence initial={false} mode="wait">
          {docked ? (
            <motion.aside
              key="docked"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 256 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25 }}
              className="w-64 overflow-hidden"
            >
              <div className="sticky top-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <FaBookOpen className="w-3.5 h-3.5 text-purple-300" />
                      CFMS Guides
                    </span>
                    <button
                      onClick={() => toggleDock(false)}
                      aria-label="Collapse guides sidebar"
                      className="text-indigo-300/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-all"
                    >
                      <FaChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                  <SidebarList />
                </div>
              </div>
            </motion.aside>
          ) : (
            <motion.button
              key="reopen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => toggleDock(true)}
              aria-label="Open guides sidebar"
              className="sticky top-6 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-2 py-3 text-indigo-200/80 hover:text-white transition-all"
            >
              <FaBookOpen className="w-4 h-4 text-purple-300" />
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ writingMode: 'vertical-rl' }}
              >
                Guides
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ========== MOBILE: trigger button ========== */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open guides"
        className="lg:hidden fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 bg-gradient-to-b from-indigo-600/90 to-purple-600/90 backdrop-blur-sm border border-white/15 rounded-r-xl rounded-l-md pl-1.5 pr-2 py-3 shadow-lg shadow-purple-900/30"
      >
        <FaBookOpen className="w-4 h-4 text-white" />
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ writingMode: 'vertical-rl' }}
        >
          Guides
        </span>
      </button>

      {/* ========== MOBILE: slide-in drawer ========== */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[80%] max-w-xs z-50 bg-gradient-to-b from-gray-900 to-indigo-950 border-r border-white/10 overflow-y-auto"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900/80 backdrop-blur-sm">
                <span className="flex items-center gap-2 text-base font-semibold text-white">
                  <FaBookOpen className="w-4 h-4 text-purple-300" />
                  CFMS Guides
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close guides"
                  className="text-indigo-200/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <SidebarList onNavigate={() => setDrawerOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
