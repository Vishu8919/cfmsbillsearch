// src/pages/register.tsx — registration page
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { FaSpinner, FaUser, FaLock, FaEnvelope, FaShieldAlt, FaFileInvoiceDollar, FaCheck, FaQuestionCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { fetchSecurityQuestions, SecurityQuestion } from '../lib/auth'

export default function Register() {
  const { user, loading: authLoading, register } = useAuth()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Security questions (required). Loaded from the backend.
  const [allQuestions, setAllQuestions] = useState<SecurityQuestion[]>([])
  const [q1, setQ1] = useState('')
  const [a1, setA1] = useState('')
  const [q2, setQ2] = useState('')
  const [a2, setA2] = useState('')

  useEffect(() => {
    fetchSecurityQuestions()
      .then(({ questions }) => setAllQuestions(questions))
      .catch(() => { /* non-fatal; user sees empty dropdowns + error on submit */ })
  }, [])

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/'

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(decodeURIComponent(nextPath))
    }
  }, [user, authLoading, router, nextPath])

  const passwordsMatch = confirm.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!q1 || !q2) {
      setError('Please choose both security questions.')
      return
    }
    if (q1 === q2) {
      setError('Please choose two different security questions.')
      return
    }
    if (a1.trim().length < 2 || a2.trim().length < 2) {
      setError('Please answer both security questions (at least 2 characters each).')
      return
    }
    setSubmitting(true)
    try {
      await register(username.trim(), email.trim(), password, [
        { questionId: q1, answer: a1.trim() },
        { questionId: q2, answer: a2.trim() },
      ])
      router.replace(decodeURIComponent(nextPath))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Create Account — CFMS Bills Status</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 flex flex-col items-center justify-center relative px-4 py-8 overflow-hidden"
        style={{ minHeight: '100dvh' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-violet-700 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-blob"></div>
          <div className="absolute top-1/4 right-0 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-purple-700 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-blob animation-delay-4000"></div>
        </div>

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md mx-auto"
        >
          <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-indigo-400/40 via-purple-400/20 to-transparent shadow-2xl">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-950/90 to-violet-950/90 backdrop-blur-xl overflow-hidden">
              {/* Branded header */}
              <div className="relative px-7 pt-8 pb-6 text-center border-b border-white/10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent"></div>
                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/50 mb-4"
                >
                  <FaFileInvoiceDollar className="w-6 h-6 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200 tracking-tight">
                  Create your account
                </h1>
                <p className="mt-1.5 text-indigo-200/60 text-sm">
                  Save bills and access them from any device
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-3.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                    Username
                  </label>
                  <div className="relative group">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent focus:bg-white/[0.07] transition-all"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                    Email
                  </label>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent focus:bg-white/[0.07] transition-all"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                    Password
                  </label>
                  <div className="relative group">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent focus:bg-white/[0.07] transition-all"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={submitting}
                      className="absolute inset-y-0 right-3 flex items-center justify-center text-indigo-300/50 hover:text-white transition disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent focus:bg-white/[0.07] transition-all"
                      disabled={submitting}
                    />
                    {passwordsMatch && (
                      <FaCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* ── Security questions (required for password recovery) ── */}
                <div className="pt-1 border-t border-white/10 mt-1">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-indigo-200/60 mb-2 mt-3 font-medium">
                    <FaQuestionCircle className="w-3 h-3" />
                    Security Questions
                  </p>
                  <p className="text-[11px] text-indigo-200/40 mb-3 leading-relaxed">
                    Used to reset your password if you forget it. Choose two and remember your answers.
                  </p>

                  {/* Question 1 */}
                  <div className="mb-3">
                    <select
                      value={q1}
                      onChange={(e) => setQ1(e.target.value)}
                      disabled={submitting}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all text-sm mb-2 disabled:opacity-50"
                    >
                      <option value="" className="bg-indigo-950">Choose question 1…</option>
                      {allQuestions.filter((q) => q.id !== q2).map((q) => (
                        <option key={q.id} value={q.id} className="bg-indigo-950">{q.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={a1}
                      onChange={(e) => setA1(e.target.value)}
                      placeholder="Your answer"
                      disabled={submitting || !q1}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all text-sm disabled:opacity-40"
                    />
                  </div>

                  {/* Question 2 */}
                  <div>
                    <select
                      value={q2}
                      onChange={(e) => setQ2(e.target.value)}
                      disabled={submitting}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all text-sm mb-2 disabled:opacity-50"
                    >
                      <option value="" className="bg-indigo-950">Choose question 2…</option>
                      {allQuestions.filter((q) => q.id !== q1).map((q) => (
                        <option key={q.id} value={q.id} className="bg-indigo-950">{q.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={a2}
                      onChange={(e) => setA2(e.target.value)}
                      placeholder="Your answer"
                      disabled={submitting || !q2}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all text-sm disabled:opacity-40"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/10 border border-red-400/30 text-red-200 px-4 py-2.5 rounded-xl text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:from-indigo-500 hover:to-purple-500 hover:shadow-purple-800/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium !mt-5"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" /> Creating account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-indigo-200/60 pt-1">
                  Already have an account?{' '}
                  <Link
                    href={`/login${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                    className="text-indigo-300 hover:text-white font-medium transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              </form>

              <div className="px-7 py-3 bg-black/20 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-indigo-200/40">
                <FaShieldAlt className="w-3 h-3" />
                Your bills stay private to your account
              </div>
            </div>
          </div>

          <p className="text-center mt-5">
            <Link href="/" className="text-xs text-indigo-300/50 hover:text-indigo-200 transition-colors">
              ← Continue without an account (single bill check)
            </Link>
          </p>
        </motion.div>

        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 8s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </main>
    </>
  )
}
