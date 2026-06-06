// src/components/AccountBar.tsx — small top-left account control
//
// Shows the logged-in username + role, a link to the admin panel (admins only),
// and a logout button. Positioned top-left so it doesn't clash with the
// existing top-right history button on the bill pages.

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaSignOutAlt, FaUserShield, FaChevronDown, FaSignInAlt } from 'react-icons/fa';
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

export default function AccountBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) {
    return (
      <div
        className="fixed left-4 z-20"
        style={{ top: 'max(16px, env(safe-area-inset-top))' }}
      >
        <Link
          href={`/login?next=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '%2F'}`}
          className="flex items-center gap-2 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-white/15 rounded-full pl-3 pr-3.5 py-1.5 text-indigo-100 hover:border-white/30 transition shadow-lg ring-1 ring-white/5"
        >
          <FaSignInAlt className="w-3.5 h-3.5 text-indigo-300" />
          <span className="text-sm font-medium">Log in</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="fixed left-4 z-20"
      style={{ top: 'max(16px, env(safe-area-inset-top))' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-white/15 rounded-full pl-2 pr-3 py-1.5 text-indigo-100 hover:border-white/30 transition shadow-lg ring-1 ring-white/5"
      >
        <FaUserCircle className="w-5 h-5 text-indigo-300" />
        <span className="text-sm font-medium max-w-[120px] truncate">{user.username}</span>
        <FaChevronDown className={`w-2.5 h-2.5 text-indigo-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-60 bg-gradient-to-b from-indigo-900/95 to-violet-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-3"
          >
            <div className="px-2 py-2 border-b border-white/10 mb-2">
              <div className="text-sm text-white font-medium truncate">{user.username}</div>
              <div className="text-xs text-indigo-300/70 truncate">{user.email}</div>
              <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${ROLE_PILL[user.role] || ROLE_PILL.customer}`}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
            </div>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg text-sm text-indigo-100 hover:bg-white/10 transition"
              >
                <FaUserShield className="w-4 h-4 text-purple-300" />
                Admin Panel
              </Link>
            )}

            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg text-sm text-red-200 hover:bg-red-500/10 transition"
            >
              <FaSignOutAlt className="w-4 h-4" />
              Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
