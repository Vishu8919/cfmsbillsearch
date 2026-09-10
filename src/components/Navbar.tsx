// src/components/Navbar.tsx — the site's single navigation bar.
//
// Replaces AccountBar, which was a floating pill fixed at top-left and rendered
// by only 6 of 19 pages. Everything else had nothing but a "← Back to Home"
// link. This mounts once in _app.tsx, so every page gets it, including the 11
// article pages and the admin panel.
//
// STICKY, NOT FIXED.
//
// The visible behaviour is what was asked for -- the bar stays pinned to the
// top of the viewport at all times. The difference is that a sticky element
// still occupies layout space, so page content starts below it naturally. A
// `fixed` bar is removed from flow, and every one of the 19 pages sets its own
// `py-8` on the content wrapper -- 32px, less than this bar is tall -- so a
// fixed bar would sit on top of every page heading until all 19 were edited to
// compensate. Sticky gets the same result without touching any of them.

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserCircle, FaSignOutAlt, FaUserShield, FaChevronDown, FaSignInAlt,
  FaBell, FaKey, FaBars, FaTimes, FaIdCard, FaCreditCard, FaFileInvoiceDollar,
} from 'react-icons/fa';
import { fetchTracking } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  subscriber: 'Subscriber',
  admin: 'Admin',
};

const ROLE_PILL: Record<string, string> = {
  customer: 'bg-white/10 text-indigo-200 border-white/10',
  subscriber: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  admin: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
};

// The six destinations people actually navigate to. Policy pages (Terms,
// Privacy, Refunds) stay in the page footers on purpose -- putting them up here
// would spend the few slots anyone reads on links nobody clicks twice.
//
// About and Contact appear in the mobile drawer only: they matter, but not
// enough to crowd the desktop bar.
const PRIMARY = [
  { href: '/', label: 'Home' },
  { href: '/bill-search', label: 'Bill Search' },
  { href: '/bulk-check', label: 'Bulk Check' },
  { href: '/tracking', label: 'Tracked Bills' },
  { href: '/articles', label: 'Articles' },
  { href: '/pricing', label: 'Pricing' },
];

const SECONDARY = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);   // account dropdown
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile nav
  const [unseen, setUnseen] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Unseen tracked-bill updates. Carried over from AccountBar unchanged,
  // including the silent failure: tracking is an enhancement and must never
  // break navigation.
  useEffect(() => {
    if (!user) { setUnseen(0); return; }
    let cancelled = false;
    fetchTracking()
      .then((d) => { if (!cancelled) setUnseen(d.unseenTotal || 0); })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close everything on navigation. Without this the mobile drawer stays open
  // over the page you just moved to.
  useEffect(() => {
    const close = () => { setDrawerOpen(false); setMenuOpen(false); };
    router.events.on('routeChangeComplete', close);
    return () => router.events.off('routeChangeComplete', close);
  }, [router.events]);

  // Escape closes the drawer -- expected on mobile, and the only way out for
  // anyone navigating by keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawerOpen(false); setMenuOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // "/" matches only itself; everything else matches its subtree, so
  // /articles/<slug> still highlights Articles.
  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  const linkClass = (href: string) =>
    'px-3 py-1.5 rounded-lg text-sm transition-colors ' +
    (isActive(href)
      ? 'bg-white/10 text-white'
      : 'text-indigo-200/75 hover:text-white hover:bg-white/5');

  return (
    <header
      className="sticky top-0 z-50 bg-gray-900/85 backdrop-blur-md border-b border-white/10"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 mr-1"
          aria-label="CFMS Bills Status — home"
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            CF
          </span>
          <span className="hidden sm:inline text-sm font-semibold text-white tracking-tight">
            CFMS Bills Status
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
              {item.href === '/tracking' && unseen > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40">
                  {unseen}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex-1 md:hidden" />

        {/* Account */}
        {user ? (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full pl-2 pr-2.5 py-1.5 text-indigo-100 transition"
            >
              <FaUserCircle className="w-5 h-5 text-indigo-300" />
              <span className="hidden sm:inline text-sm font-medium max-w-[110px] truncate">
                {user.username}
              </span>
              {unseen > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${unseen} tracked bill update(s)`} />
              )}
              <FaChevronDown className={`w-2.5 h-2.5 text-indigo-300 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                  className="absolute right-0 mt-2 w-60 bg-gradient-to-b from-indigo-900/95 to-violet-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-3"
                >
                  <div className="px-2 py-2 border-b border-white/10 mb-2">
                    <div className="text-sm text-white font-medium truncate">{user.username}</div>
                    <div className="text-xs text-indigo-300/70 truncate">{user.email}</div>
                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${ROLE_PILL[user.role] || ROLE_PILL.customer}`}>
                      {ROLE_LABEL[user.role] || user.role}
                    </span>
                  </div>

                  <Link href="/tracking" className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition">
                    <FaBell className="w-4 h-4 text-indigo-300" />
                    Tracked Bills
                    {unseen > 0 && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40">
                        {unseen}
                      </span>
                    )}
                  </Link>

                  <Link href="/settings/billing" className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition">
                    <FaCreditCard className="w-4 h-4 text-indigo-300" />
                    Billing
                  </Link>

                  <Link href="/settings/department" className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition">
                    <FaIdCard className="w-4 h-4 text-indigo-300" />
                    Govt. Verification
                  </Link>

                  <Link href="/settings/cfms" className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition">
                    <FaFileInvoiceDollar className="w-4 h-4 text-indigo-300" />
                    CFMS Credentials
                  </Link>

                  <Link href="/settings/password" className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition">
                    <FaKey className="w-4 h-4 text-indigo-300" />
                    Change Password
                  </Link>

                  {user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition">
                      <FaUserShield className="w-4 h-4 text-purple-300" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg text-sm text-red-200 hover:bg-red-500/10 transition"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-3 py-1.5 text-indigo-100 transition"
          >
            <FaSignInAlt className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-sm font-medium">Log in</span>
          </Link>
        )}

        {/* Mobile toggle. Most traffic here is mobile, so this is the primary
            navigation path rather than an afterthought. */}
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          className="md:hidden shrink-0 ml-1 p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-white/5 transition"
        >
          {drawerOpen ? <FaTimes className="w-4 h-4" /> : <FaBars className="w-4 h-4" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-md"
          >
            <div className="px-3 py-3 space-y-1">
              {PRIMARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ' +
                    (isActive(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-200/75 hover:text-white hover:bg-white/5')
                  }
                >
                  <span>{item.label}</span>
                  {item.href === '/tracking' && unseen > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40">
                      {unseen}
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-2 mt-2 border-t border-white/10 grid grid-cols-2 gap-1">
                {SECONDARY.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 rounded-lg text-sm text-indigo-200/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
