// src/components/Navbar.tsx — the site's single navigation bar.
//
// Mounted once in _app.tsx, so every route gets it: all 19 pages, the 11
// article pages, and /admin.
//
// ── Design notes ─────────────────────────────────────────────────────────
//
// The first version read as a separate black strip bolted on top of the page.
// Three changes fix that:
//
// 1. TRANSPARENT AT REST. At the top of the page the bar has no background at
//    all -- the page's own gradient runs straight through it. The background
//    and hairline fade in only once you scroll. This does most of the work of
//    making it feel part of the page rather than sitting on it.
//
// 2. CENTRED LINKS, THREE-COLUMN LAYOUT. Brand left, links centred on the
//    viewport, account right. The old version clustered brand and links
//    together on the left and left a dead gap in the middle.
//
// 3. NO BOXES. Links are small, low-contrast text. The current page is marked
//    with full-strength white and a 1px underline rather than a filled pill --
//    a chunky rectangle around one item is what dated the first attempt.
//
// STICKY, NOT FIXED: sticky pins to the viewport top exactly like fixed but
// stays in layout flow. Every page sets its own py-8 (32px) content padding,
// less than this bar is tall, so a fixed bar would cover 30 page headings
// until all 30 were edited.

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

// Bill Search is deliberately NOT in the primary set. Single-bill search is the
// main event on the home page, so a nav entry for it sent people to a second,
// plainer copy of what they had just been given.
//
// The page itself stays -- it holds users' saved search history in
// localStorage and has organic search traffic -- it just stops competing with
// Home. It remains reachable from the mobile drawer and the page footers.
const PRIMARY = [
  { href: '/', label: 'Home' },
  { href: '/bulk-check', label: 'Bulk Check' },
  { href: '/tracking', label: 'Tracked Bills' },
  { href: '/articles', label: 'Articles' },
  { href: '/pricing', label: 'Pricing' },
];

const SECONDARY = [
  { href: '/bill-search', label: 'Bill Search' },
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

  // Drives the transparent-to-solid transition. `passive` because this fires
  // on every scroll frame and must never block the scroll itself.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // reloading mid-page must not start out transparent
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

  // Close on navigation, or the drawer stays open over the page you just
  // moved to.
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

  const solid = scrolled || drawerOpen;

  return (
    <header
      className={
        'sticky top-0 z-50 transition-colors duration-300 ' +
        (solid
          ? 'bg-[#12102a]/80 backdrop-blur-xl border-b border-white/[0.07]'
          : 'bg-transparent border-b border-transparent')
      }
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center">

        {/* Left — brand */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="CFMS Bills Status — home"
        >
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold tracking-tight">
            CF
          </span>
          <span className="text-[13px] font-medium text-white/90 group-hover:text-white transition-colors tracking-tight whitespace-nowrap">
            CFMS Bills Status
          </span>
        </Link>

        {/* Centre — links.
            Absolutely centred on the bar rather than laid out between brand and
            account, so the group does not shift every time a username is a
            different length. */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3.5 py-2 text-[13px] tracking-tight whitespace-nowrap"
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
                  <span className="ml-1.5 align-middle text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                    {unseen}
                  </span>
                )}
                {/* Active marker: a hairline that slides between items, not a
                    filled pill. */}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-3.5 right-3.5 bottom-0 h-px bg-white/60"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Right — account */}
        {user ? (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 py-1.5 pl-1.5 pr-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <FaUserCircle className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline text-[13px] max-w-[100px] truncate tracking-tight">
                {user.username}
              </span>
              {unseen > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              <FaChevronDown
                className={`w-2.5 h-2.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#151233]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 p-2"
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
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-[13px] text-white/75 hover:text-white hover:bg-white/[0.06] transition-colors tracking-tight"
          >
            <FaSignInAlt className="w-3 h-3" />
            Log in
          </Link>
        )}

        {/* Mobile toggle. Most traffic here is mobile, so the drawer is the
            primary navigation path, not a fallback. */}
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          className="md:hidden shrink-0 ml-0.5 p-2 -mr-1 rounded-lg text-white/70 hover:text-white transition-colors"
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
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="md:hidden overflow-hidden border-t border-white/[0.07]"
          >
            <div className="px-3 py-2">
              {PRIMARY.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      'flex items-center justify-between px-3 py-3 rounded-xl text-[15px] transition-colors ' +
                      (active ? 'text-white bg-white/[0.07]' : 'text-white/65 hover:text-white')
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

              <div className="mt-2 pt-2 border-t border-white/[0.07] flex flex-wrap">
                {SECONDARY.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2.5 text-[13px] text-white/50 hover:text-white/85 transition-colors"
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
