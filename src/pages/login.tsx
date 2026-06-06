// src/pages/login.tsx — login page
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { FaSpinner, FaUser, FaLock, FaShieldAlt, FaFileInvoiceDollar } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading: authLoading, login } = useAuth()
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/'

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(decodeURIComponent(nextPath))
    }
  }, [user, authLoading, router, nextPath])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!identifier.trim() || !password) {
      setError('Enter your email/username and password.')
      return
    }
    setSubmitting(true)
    try {
      await login(identifier.trim(), password)
      router.replace(decodeURIComponent(nextPath))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Log In — CFMS Bills Status</title>
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
          {/* Gradient-border card */}
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
                  Welcome back
                </h1>
                <p className="mt-1.5 text-indigo-200/60 text-sm">
                  Log in to access your saved bills
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                    Email or Username
                  </label>
                  <div className="relative group">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
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
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
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
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:from-indigo-500 hover:to-purple-500 hover:shadow-purple-800/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" /> Logging in…
                    </>
                  ) : (
                    'Log In'
                  )}
                </button>

                <p className="text-center text-sm pt-1">
                  <Link
                    href="/forgot-password"
                    className="text-indigo-300/80 hover:text-white transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </p>

                <p className="text-center text-sm text-indigo-200/60">
                  Don&apos;t have an account?{' '}
                  <Link
                    href={`/register${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                    className="text-indigo-300 hover:text-white font-medium transition-colors"
                  >
                    Create one
                  </Link>
                </p>
              </form>

              {/* Trust footer */}
              <div className="px-7 py-3 bg-black/20 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-indigo-200/40">
                <FaShieldAlt className="w-3 h-3" />
                Your bills stay private to your account
              </div>
            </div>
          </div>

          {/* Back to public single-bill check */}
          <p className="text-center mt-5">
            <Link href="/" className="text-xs text-indigo-300/50 hover:text-indigo-200 transition-colors">
              ← Continue without logging in (single bill check)
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
