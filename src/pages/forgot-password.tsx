// src/pages/forgot-password.tsx — reset password via security questions
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { FaSpinner, FaUser, FaLock, FaShieldAlt, FaKey, FaCheck, FaCheckCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { forgotLookup, forgotReset } from '../lib/auth'

type Step = 'lookup' | 'answer' | 'done'

export default function ForgotPassword() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>('lookup')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [identifier, setIdentifier] = useState('')
  // Step 2
  const [resolvedUser, setResolvedUser] = useState('')
  const [questions, setQuestions] = useState<{ questionId: string; label: string }[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Already logged in? No need to be here.
  useEffect(() => {
    if (!authLoading && user) router.replace('/')
  }, [user, authLoading, router])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!identifier.trim()) {
      setError('Enter your email or username.')
      return
    }
    setSubmitting(true)
    try {
      const res = await forgotLookup(identifier.trim())
      setResolvedUser(res.username)
      setQuestions(res.questions)
      setAnswers({})
      setStep('answer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find your account.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    for (const q of questions) {
      if (!(answers[q.questionId] || '').trim()) {
        setError('Please answer both security questions.')
        return
      }
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await forgotReset({
        identifier: identifier.trim(),
        answers: questions.map((q) => ({ questionId: q.questionId, answer: (answers[q.questionId] || '').trim() })),
        newPassword,
      })
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password — CFMS Bills Status</title>
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
              {/* Header */}
              <div className="relative px-7 pt-8 pb-6 text-center border-b border-white/10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent"></div>
                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/50 mb-4"
                >
                  {step === 'done' ? <FaCheckCircle className="w-6 h-6 text-white" /> : <FaKey className="w-6 h-6 text-white" />}
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200 tracking-tight">
                  {step === 'lookup' && 'Reset password'}
                  {step === 'answer' && 'Verify your identity'}
                  {step === 'done' && 'Password updated'}
                </h1>
                <p className="mt-1.5 text-indigo-200/60 text-sm">
                  {step === 'lookup' && 'Enter your account to begin'}
                  {step === 'answer' && `Answer your security questions, ${resolvedUser}`}
                  {step === 'done' && 'You can now log in with your new password'}
                </p>
              </div>

              <div className="px-7 py-6">
                {/* STEP 1: lookup */}
                {step === 'lookup' && (
                  <form onSubmit={handleLookup} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                        Email or Username
                      </label>
                      <div className="relative group">
                        <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all"
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-400/30 text-red-200 px-4 py-2.5 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      {submitting ? (<><FaSpinner className="animate-spin" /> Checking…</>) : 'Continue'}
                    </button>
                  </form>
                )}

                {/* STEP 2: answer + new password */}
                {step === 'answer' && (
                  <form onSubmit={handleReset} className="space-y-4">
                    {questions.map((q, idx) => (
                      <div key={q.questionId}>
                        <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                          {q.label}
                        </label>
                        <div className="relative group">
                          <FaShieldAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                          <input
                            type="text"
                            value={answers[q.questionId] || ''}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                            placeholder={`Answer ${idx + 1}`}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-white/10">
                      <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 mt-3 font-medium">
                        New Password
                      </label>
                      <div className="relative group">
                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all"
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          disabled={submitting}
                          className="absolute inset-y-0 right-3 flex items-center justify-center text-indigo-300/50 hover:text-white transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-indigo-200/60 mb-1.5 font-medium">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300/40 group-focus-within:text-indigo-300 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all"
                          disabled={submitting}
                        />
                        {confirm.length > 0 && newPassword === confirm && (
                          <FaCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-400/30 text-red-200 px-4 py-2.5 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      {submitting ? (<><FaSpinner className="animate-spin" /> Resetting…</>) : 'Reset Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep('lookup'); setError(null); }}
                      disabled={submitting}
                      className="w-full text-sm text-indigo-300/60 hover:text-indigo-200 transition-colors"
                    >
                      ← Use a different account
                    </button>
                  </form>
                )}

                {/* STEP 3: done */}
                {step === 'done' && (
                  <div className="text-center py-2">
                    <Link
                      href="/login"
                      className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:from-indigo-500 hover:to-purple-500 transition-all font-medium"
                    >
                      Go to Login
                    </Link>
                  </div>
                )}
              </div>

              <div className="px-7 py-3 bg-black/20 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-indigo-200/40">
                <FaShieldAlt className="w-3 h-3" />
                We verify your identity with your security answers
              </div>
            </div>
          </div>

          <p className="text-center mt-5">
            <Link href="/login" className="text-xs text-indigo-300/50 hover:text-indigo-200 transition-colors">
              ← Back to login
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
