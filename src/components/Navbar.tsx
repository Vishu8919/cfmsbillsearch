// src/components/Navbar.tsx — floating pill navigation.
//
// Mounted once in _app.tsx, so every route gets it: all 18 pages, the 11
// article pages, and /admin.
//
// ── Design ───────────────────────────────────────────────────────────────
//
// A short, centred, floating island rather than a full-width bar. The glass
// treatment is lifted verbatim from the CFMS Guides sidebar card so the two
// read as the same material:
//
//     bg-white/5 + border border-white/10 + backdrop-blur
//
// The header wrapper itself is fully transparent -- only the pill has a
// surface -- so the page gradient shows around and behind it. On scroll the
// pill firms up very slightly (white/5 -> white/[0.08], heavier shadow), just
// enough to hold its edge against busy content underneath.
//
// ── Layout: FIXED, and why it changed from sticky ────────────────────────
//
// A sticky header is a sibling ABOVE each page's <main>, and the gradient
// lives on that <main>. So the 4rem of flow the header occupied showed the
// BODY background (#111827) instead -- a flat dark band across the top, with
// the page's to-br gradient starting below it and already shifted purple on
// the right. The pill was transparent, but there was nothing behind it to be
// transparent to.
//
// Fixed takes the header out of flow entirely, so every page's gradient runs
// to the top of the viewport and passes behind the pill. No band, no seam.
//
// TWO CONSEQUENCES, both handled:
//
//   1. POINTER EVENTS. The header is now a full-width transparent strip
//      sitting on top of every page. Without pointer-events-none on the
//      wrapper (and pointer-events-auto on the pills themselves) it would
//      silently swallow every click in the top 4rem of every page.
//
//   2. PAGE PADDING. Nothing reserves space any more, so page content would
//      start under the pill. globals.css adds padding-top to each page root
//      -- targeted at `#__next > *:not(header)` rather than `main`, because
//      tracking.tsx and settings/cfms.tsx do not use a <main> element at all
//      and a main-only rule silently skipped them.
//
// HEIGHT IS LOAD-BEARING: pt-3 (0.75rem) + pill h-11 (2.75rem) + pb-2
// (0.5rem) = 4rem, and globals.css pads every page by the same 4rem.

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

// Bill Search is gone entirely -- single-bill search is the main event on the
// home page, and the home page's history button reads the same `billHistory`
// localStorage key the old page used, so no user data is orphaned.
const PRIMARY = [
  { href: '/', label: 'Home' },
  { href: '/bulk-check', label: 'Bulk Check' },
  { href: '/tracking', label: 'Tracked Bills' },
  { href: '/articles', label: 'Articles' },
  { href: '/pricing', label: 'Pricing' },
];

const SECONDARY = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const MENU_ITEMS = [
  { href: '/tracking', icon: FaBell, label: 'Tracked Bills', badged: true, tone: 'text-indigo-300/80' },
  { href: '/settings/billing', icon: FaCreditCard, label: 'Billing', badged: false, tone: 'text-indigo-300/80' },
  { href: '/settings/department', icon: FaIdCard, label: 'Govt. Verification', badged: false, tone: 'text-indigo-300/80' },
  { href: '/settings/cfms', icon: FaFileInvoiceDollar, label: 'CFMS Credentials', badged: false, tone: 'text-indigo-300/80' },
  { href: '/settings/password', icon: FaKey, label: 'Change Password', badged: false, tone: 'text-indigo-300/80' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // `passive` because this fires on every scroll frame and must never block
  // the scroll itself.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // reloading mid-page must not start in the at-rest state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Unseen tracked-bill updates. Silent on failure: tracking is an
  // enhancement and must never break navigation.
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

  useEffect(() => {
    const close = () => { setDrawerOpen(false); setMenuOpen(false); };
    router.events.on('routeChangeComplete', close);
    return () => router.events.off('routeChangeComplete', close);
  }, [router.events]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawerOpen(false); setMenuOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // '/' matches only itself; everything else matches its subtree, so
  // /articles/<slug> still marks Articles as current.
  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  // Same glass as the Guides card, firming up a touch once scrolled.
  const shell =
    'flex items-center h-11 rounded-full border backdrop-blur-xl transition-colors duration-300 ' +
    (scrolled
      ? 'bg-white/[0.08] border-white/[0.14] shadow-lg shadow-black/25'
      : 'bg-white/5 border-white/10 shadow-md shadow-black/10');

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 pb-2 px-3 sm:px-4 pointer-events-none"
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
    >
      {/* ── Scrim ──────────────────────────────────────────────────────────
          The pill is short and centred, so the strip either side of it is
          empty. Being fixed, page text scrolls straight under the header and
          reappears beside and through the pill -- which reads as the bar
          floating over broken content rather than sitting above it.

          This fades and blurs whatever passes underneath.

          It is a GRADIENT to transparent, not a solid band, and that choice is
          deliberate: a solid full-width strip is exactly what produced the
          hard dark line reported earlier. A fade has no edge to notice.

          6rem tall against a 4rem header, so the fade has room to finish below
          the pill. Absolutely positioned, so it adds no layout height and the
          4rem padding rule in globals.css still holds exactly.

          aria-hidden: pure decoration. Inside the pointer-events-none
          wrapper, so it never intercepts a click. */}
      <div
        aria-hidden="true"
        className={
          'absolute inset-x-0 top-0 h-24 backdrop-blur-md bg-gradient-to-b ' +
          'from-[#14112f]/90 via-[#14112f]/40 to-transparent ' +
          'transition-opacity duration-300 ' +
          (scrolled || drawerOpen ? 'opacity-100' : 'opacity-0')
        }
      />

      {/* Desktop pill.
          `relative` so it paints above the absolutely-positioned scrim -- an
          unpositioned sibling after an absolute one loses the stacking
          contest. */}
      <nav className={`relative hidden md:flex mx-auto w-fit gap-1 pl-3 pr-2 pointer-events-auto ${shell}`}>
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group pr-2 mr-1 border-r border-white/10"
          aria-label="CFMS Bills Status — home"
        >
          <img
            src="/favicon.ico"
            alt="CFMS Bills Status"
            className="w-6 h-6 rounded-md object-contain shrink-0"
          />
          <span className="text-[13px] font-medium text-white/90 group-hover:text-white transition-colors tracking-tight whitespace-nowrap">
            CFMS Bills Status
          </span>
        </Link>

        {PRIMARY.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center h-full px-3 text-[13px] tracking-tight whitespace-nowrap"
            >
              <span
                className={
                  'transition-colors duration-200 ' +
                  (active ? 'text-white' : 'text-white/55 hover:text-white/90')
                }
              >
                {item.label}
              </span>
              {item.href === '/tracking' && unseen > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                  {unseen}
                </span>
              )}
              {/* Inset so the hairline sits inside the pill rather than on its
                  curved edge. */}
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-3 right-3 bottom-2 h-px bg-white/60"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </Link>
          );
        })}

        <div className="ml-1 pl-1 border-l border-white/10 flex items-center">
          {user ? <AccountMenu /> : <LoginLink />}
        </div>
      </nav>

      {/* Mobile pill */}
      <nav className={`relative md:hidden mx-auto w-full max-w-md justify-between pl-3 pr-2 pointer-events-auto ${shell}`}>
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="CFMS Bills Status — home">
          <img
            src="/favicon.ico"
            alt="CFMS Bills Status"
            className="w-6 h-6 rounded-md object-contain shrink-0"
          />
          <span className="text-[13px] font-medium text-white/90 tracking-tight">CFMS Bills Status</span>
        </Link>
        <div className="flex items-center gap-0.5">
          {user ? <AccountMenu /> : <LoginLink />}
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {drawerOpen ? <FaTimes className="w-4 h-4" /> : <FaBars className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet — a separate floating card below the pill, same glass. */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="relative md:hidden mx-auto w-full max-w-md mt-2 rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl shadow-xl shadow-black/25 p-2 pointer-events-auto"
          >
            {PRIMARY.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] transition-colors ' +
                    (active ? 'text-white bg-white/[0.09]' : 'text-white/65 hover:text-white')
                  }
                >
                  <span>{item.label}</span>
                  {item.href === '/tracking' && unseen > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                      {unseen}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="mt-1.5 pt-1.5 border-t border-white/10 flex">
              {SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-[13px] text-white/50 hover:text-white/85 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );

  function LoginLink() {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-[13px] text-white/75 hover:text-white hover:bg-white/[0.08] transition-colors tracking-tight"
      >
        <FaSignInAlt className="w-3 h-3" />
        Log in
      </Link>
    );
  }

  function AccountMenu() {
    return (
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-1.5 py-1.5 pl-1.5 pr-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <FaUserCircle className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline text-[13px] max-w-[92px] truncate tracking-tight">
            {user?.username}
          </span>
          {unseen > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <FaChevronDown
            className={`w-2.5 h-2.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {menuOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              role="menu"
              className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-[#151233]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 p-2"
            >
              <div className="px-2.5 py-2 mb-1.5 border-b border-white/[0.07]">
                <div className="text-[13px] text-white font-medium truncate">{user.username}</div>
                <div className="text-[11px] text-white/45 truncate">{user.email}</div>
                <span
                  className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${ROLE_PILL[user.role] || ROLE_PILL.customer}`}
                >
                  {ROLE_LABEL[user.role] || user.role}
                </span>
              </div>

              {MENU_ITEMS.map(({ href, icon: Icon, label, badged, tone }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[13px] text-white/75 hover:text-white hover:bg-white/[0.07] transition-colors"
                >
                  <Icon className={`w-3.5 h-3.5 ${tone}`} />
                  {label}
                  {badged && unseen > 0 && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                      {unseen}
                    </span>
                  )}
                </Link>
              ))}

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[13px] text-white/75 hover:text-white hover:bg-white/[0.07] transition-colors"
                >
                  <FaUserShield className="w-3.5 h-3.5 text-purple-300/80" />
                  Admin Panel
                </Link>
              )}

              <div className="my-1.5 border-t border-white/[0.07]" />

              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-xl text-[13px] text-red-300/85 hover:text-red-200 hover:bg-red-500/10 transition-colors"
              >
                <FaSignOutAlt className="w-3.5 h-3.5" />
                Log Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}
