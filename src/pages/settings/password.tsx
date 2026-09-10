// src/pages/settings/password.tsx — change your password while logged in.
//
// Distinct from /forgot-password, which is for someone locked out answering
// security questions. This is for someone who is signed in and knows their
// current password.

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { FaLock, FaSpinner, FaCheckCircle } from 'react-icons/fa'
import RequireAuth from '../../components/RequireAuth'
import { changePasswordRequest, setToken } from '../../lib/auth'

const MIN_LENGTH = 6

function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Checked here purely so the user finds out before a round trip. The server
  // enforces all of it again -- this is convenience, not security.
  function validate(): string | null {
    if (!current) return 'Enter your current password.'
    if (!next) return 'Enter a new password.'
    if (next.length < MIN_LENGTH) return `New password must be at least ${MIN_LENGTH} characters.`
    if (next === current) return 'Your new password must be different from your current one.'
    if (next !== confirm) return 'The two new passwords do not match.'
    return null
  }

  async function onSubmit() {
    setError(null)
    const problem = validate()
    if (problem) return setError(problem)

    setSaving(true)
    try {
      const res = await changePasswordRequest({ currentPassword: current, newPassword: next })
      // The server issues a fresh token so THIS device stays signed in while
      // every other one is dropped. Storing it is what keeps the user from
      // being logged out by their own password change.
      if (res.token) setToken(res.token)
      setDone(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  const strength =
    next.length === 0 ? null
      : next.length < MIN_LENGTH ? 'too short'
        : next.length < 10 ? 'okay'
          : 'strong'

  return (
    <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
          ← Back to Home
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
          Change password
        </h1>
        <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
      </motion.div>

      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-emerald-400/25 rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Password changed</h2>
          </div>
          <p className="text-sm leading-relaxed text-indigo-200/70">
            Your new password is active. You are still signed in here, but any other
            device that was logged in has been signed out and will need the new
            password.
          </p>
          <div className="flex gap-3 pt-1">
            <Link
              href="/"
              className="rounded-xl bg-indigo-500 hover:bg-indigo-400 px-5 py-2.5 text-sm text-white transition-colors"
            >
              Done
            </Link>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-indigo-100 hover:bg-white/5 transition-colors"
            >
              Change it again
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-start gap-3">
            <FaLock className="mt-1 text-indigo-300/70 shrink-0" />
            <p className="text-sm leading-relaxed text-indigo-200/70">
              Changing your password signs you out everywhere else. You will stay
              signed in on this device.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="current" className="block text-sm text-indigo-200/80">
              Current password
            </label>
            <div className="relative">
              <input
                id="current"
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-11 text-sm text-white placeholder-indigo-200/30 focus:outline-none focus:border-indigo-400/50"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-200/50 hover:text-indigo-200"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="next" className="block text-sm text-indigo-200/80">
              New password
            </label>
            <div className="relative">
              <input
                id="next"
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-11 text-sm text-white placeholder-indigo-200/30 focus:outline-none focus:border-indigo-400/50"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                aria-label={showNext ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-200/50 hover:text-indigo-200"
              >
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-indigo-300/50">
              At least {MIN_LENGTH} characters.
              {strength && (
                <span
                  className={
                    strength === 'strong' ? ' text-emerald-300/70'
                      : strength === 'okay' ? ' text-amber-300/70'
                        : ' text-red-300/70'
                  }
                >
                  {' '}· {strength}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm" className="block text-sm text-indigo-200/80">
              Confirm new password
            </label>
            <input
              id="confirm"
              type={showNext ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-indigo-200/30 focus:outline-none focus:border-indigo-400/50"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm text-red-200/90">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/40 disabled:cursor-not-allowed px-5 py-3 text-sm text-white transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (<><FaSpinner className="animate-spin" /> Changing…</>) : 'Change password'}
          </button>

          <p className="text-xs text-center text-indigo-300/50">
            Forgotten your current password?{' '}
            <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
              Reset it with your security questions
            </Link>
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <>
      <Head>
        <title>Change password | CFMS Bills Status</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 relative"
        style={{ minHeight: '100dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        </div>
        <RequireAuth>
          <ChangePassword />
        </RequireAuth>
      </main>
    </>
  )
}
