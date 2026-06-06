// src/pages/admin.tsx — admin panel (user + role management)
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaCrown, FaUserShield, FaUserSlash, FaSearch,
  FaSpinner, FaTrashAlt, FaCheck, FaSync,
} from 'react-icons/fa';
import RequireAuth from '../components/RequireAuth';
import AccountBar from '../components/AccountBar';
import { useAuth } from '../context/AuthContext';
import {
  AuthUser, Role,
  adminFetchStats, adminFetchUsers, adminSetRole, adminSetActive, adminDeleteUser,
  AdminStats,
} from '../lib/auth';

const ROLES: Role[] = ['customer', 'subscriber', 'admin'];

const ROLE_PILL: Record<string, string> = {
  customer: 'bg-white/10 text-indigo-200 border-white/10',
  subscriber: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  admin: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
};

function StatCard({ icon, label, value, tint }: {
  icon: React.ReactNode; label: string; value: number; tint: string;
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-white/15 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
        <div className="text-xs text-indigo-200/70 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function AdminPanel() {
  const { user: me } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AuthUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const [s, u] = await Promise.all([
        adminFetchStats(),
        adminFetchUsers({ q, limit: 100 }),
      ]);
      setStats(s);
      setUsers(u.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => { load(search.trim()); }, 350);
    return () => clearTimeout(id);
  }, [search, load]);

  async function handleRole(u: AuthUser, role: Role) {
    if (role === u.role) return;
    setBusyId(u.id);
    try {
      const { user } = await adminSetRole(u.id, role);
      setUsers((prev) => prev.map((x) => (x.id === user.id ? user : x)));
      showToast(`${user.username} is now ${role}`);
      adminFetchStats().then(setStats).catch(() => {});
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not change role');
    } finally {
      setBusyId(null);
    }
  }

  async function handleActive(u: AuthUser) {
    setBusyId(u.id);
    try {
      const { user } = await adminSetActive(u.id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x.id === user.id ? user : x)));
      showToast(`${user.username} ${user.isActive ? 'enabled' : 'disabled'}`);
      adminFetchStats().then(setStats).catch(() => {});
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(u: AuthUser) {
    setBusyId(u.id);
    try {
      await adminDeleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      showToast(`${u.username} deleted`);
      adminFetchStats().then(setStats).catch(() => {});
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete');
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Panel — CFMS Bills Status</title>
        <meta name="robots" content="noindex" />
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

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8" style={{ paddingTop: 'max(72px, calc(env(safe-area-inset-top) + 56px))' }}>
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
              Admin Panel
            </h1>
            <p className="mt-2 text-indigo-200/70 text-xs sm:text-sm">
              Manage users, roles, and access
            </p>
            <div className="mt-3 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
            <Link href="/" className="inline-block mt-4 text-xs text-indigo-300/80 hover:text-indigo-200 underline underline-offset-4">
              ← Back to bill checker
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          >
            <StatCard icon={<FaUsers className="w-5 h-5 text-indigo-200" />} label="Total" value={stats?.total ?? 0} tint="bg-indigo-500/20" />
            <StatCard icon={<FaCrown className="w-5 h-5 text-emerald-200" />} label="Subscribers" value={stats?.subscribers ?? 0} tint="bg-emerald-500/20" />
            <StatCard icon={<FaUserShield className="w-5 h-5 text-purple-200" />} label="Admins" value={stats?.admins ?? 0} tint="bg-purple-500/20" />
            <StatCard icon={<FaUserSlash className="w-5 h-5 text-red-200" />} label="Disabled" value={stats?.disabled ?? 0} tint="bg-red-500/20" />
          </motion.div>

          {/* Search + refresh */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-indigo-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={() => load(search.trim())}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-100 border border-white/10 transition flex items-center gap-2"
              title="Refresh"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          {/* User list */}
          <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden">
            {loading && users.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-indigo-200/60">
                <FaSpinner className="w-6 h-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-indigo-200/60 text-sm">No users found.</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {users.map((u) => {
                  const isMe = me?.id === u.id;
                  const busy = busyId === u.id;
                  return (
                    <li key={u.id} className={`p-4 ${!u.isActive ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white truncate">{u.username}</span>
                            {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">you</span>}
                            {!u.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-200 border border-red-400/30">disabled</span>}
                          </div>
                          <div className="text-xs text-indigo-300/70 truncate mt-0.5">{u.email}</div>
                        </div>

                        {/* Role selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={busy || isMe}
                            onChange={(e) => handleRole(u, e.target.value as Role)}
                            className={`text-xs rounded-lg px-2.5 py-1.5 border bg-indigo-950/60 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${ROLE_PILL[u.role] || ''}`}
                            title={isMe ? "You can't change your own role" : 'Change role'}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="bg-indigo-950 text-white">{r}</option>
                            ))}
                          </select>

                          {/* Enable/disable */}
                          <button
                            onClick={() => handleActive(u)}
                            disabled={busy || isMe}
                            title={isMe ? "You can't disable yourself" : (u.isActive ? 'Disable account' : 'Enable account')}
                            className={`p-2 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'bg-amber-500/10 border-amber-400/20 text-amber-200 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border-emerald-400/20 text-emerald-200 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.isActive ? <FaUserSlash className="w-3.5 h-3.5" /> : <FaCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={busy || isMe}
                            title={isMe ? "You can't delete yourself" : 'Delete user'}
                            className="p-2 rounded-lg border border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {busy ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaTrashAlt className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="text-xs text-indigo-300/40 mt-4 text-center">
            {users.length} user{users.length !== 1 ? 's' : ''} shown
          </p>
        </div>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDelete(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-indigo-900 to-violet-900 border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white mb-2">Delete user?</h3>
                <p className="text-sm text-indigo-200/80 mb-1">
                  This permanently deletes <span className="font-semibold text-white">{confirmDelete.username}</span> ({confirmDelete.email}).
                </p>
                <p className="text-xs text-red-300/80 mb-5">This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(confirmDelete)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 rounded-xl hover:from-red-500 hover:to-rose-500 transition flex items-center justify-center gap-2"
                  >
                    <FaTrashAlt className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-indigo-100 border border-white/10 py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/95 border border-white/15 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

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
        `}</style>
      </main>
    </>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth roles={['admin']}>
      <AdminPanel />
    </RequireAuth>
  );
}
