import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import {
  FaShieldAlt, FaSpinner, FaTrashAlt, FaCheckCircle,
  FaExclamationTriangle, FaLock,
} from 'react-icons/fa'
import RequireAuth from '../../components/RequireAuth'
import AccountBar from '../../components/AccountBar'
import {
  fetchCredentialStatus, saveCfmsCredentials, deleteCfmsCredentials,
  CredentialStatus,
} from '../../lib/auth'

function CfmsSettings() {
  const [status, setStatus] = useState<CredentialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [probeBill, setProbeBill] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [consented, setConsented] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setStatus(await fetchCredentialStatus())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setError(null); setOk(null)
    if (!username.trim() || !password) { setError('Enter your CFMS username and password.'); return }
    if (!consented) { setError('You must accept the terms before credentials can be stored.'); return }
    const version = status?.currentConsentVersion || status?.consentVersion
    if (!version) { setError('Could not determine consent version. Reload the page.'); return }

    setSaving(true)
    try {
      const res = await saveCfmsCredentials({
        username: username.trim(), password, consent: true,
        consentVersion: version,
        probeBill: probeBill.trim() || undefined,
      })
      setOk(res.message)
      setUsername(''); setPassword(''); setProbeBill(''); setConsented(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save credentials')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete your stored CFMS credentials? Automatic checking will stop immediately.')) return
    setDeleting(true); setError(null); setOk(null)
    try {
      const res = await deleteCfmsCredentials()
      setOk(res.message)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete credentials')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Head>
        <title>CFMS Credentials · CFMS Bills Status</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <AccountBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/tracking" className="text-xs text-indigo-300 hover:text-white">
            ← Back to tracked bills
          </Link>

          <h1 className="text-2xl font-bold mt-3 mb-1 flex items-center gap-2">
            <FaShieldAlt className="w-5 h-5 text-indigo-300" />
            CFMS credentials
          </h1>
          <p className="text-sm text-indigo-200/70 mb-6">
            Needed only for automatic bill checking. Manual checking never stores anything.
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-indigo-200/70 py-8 justify-center">
              <FaSpinner className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          {!loading && status && !status.vaultAvailable && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              Credential storage is not configured on the server, so automatic
              checking is unavailable. Manual bill checking is unaffected.
            </div>
          )}

          {!loading && status?.vaultAvailable && (
            <>
              {/* Current state */}
              <div className="rounded-xl border border-white/15 bg-white/5 p-4 mb-6">
                {status.hasCredentials ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      {status.healthy
                        ? <FaCheckCircle className="w-4 h-4 text-emerald-300" />
                        : <FaExclamationTriangle className="w-4 h-4 text-amber-300" />}
                      <span className="font-semibold">
                        {status.healthy ? 'Credentials saved and working' : 'Credentials saved, but failing'}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-200/60 mt-2 space-y-0.5">
                      {status.consentAt && <div>Consent given {new Date(status.consentAt).toLocaleString()}</div>}
                      {status.lastUsedAt && <div>Last used {new Date(status.lastUsedAt).toLocaleString()}</div>}
                      {!!status.failCount && <div className="text-amber-200">{status.failCount} recent login failure(s)</div>}
                    </div>
                    {status.needsReconsent && (
                      <div className="mt-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg p-2">
                        The terms have been updated. Re-save your credentials to continue automatic checking.
                      </div>
                    )}
                    <button
                      onClick={remove}
                      disabled={deleting}
                      className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition disabled:opacity-60"
                    >
                      {deleting ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaTrashAlt className="w-3 h-3" />}
                      Delete credentials
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-indigo-200/70">
                    No credentials stored. Automatic checking is off.
                  </div>
                )}
              </div>

              {/* Consent + form */}
              <div className="rounded-xl border border-white/15 bg-white/5 p-5">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <FaLock className="w-3.5 h-3.5 text-indigo-300" />
                  {status.hasCredentials ? 'Replace credentials' : 'Enable automatic checking'}
                </h2>

                <div className="text-xs text-indigo-100/90 space-y-3 bg-black/20 rounded-lg p-4 mb-4 leading-relaxed">
                  <p>
                    To check your bills automatically we need to store your CFMS
                    username and password. They are encrypted before being saved
                    and are used only to log in to CFMS on your behalf, every few
                    hours, for the bills you have chosen to track.
                  </p>
                  <p>
                    We do not send you email. Updates appear on your Tracked bills
                    page, each showing exactly when it was last checked.
                  </p>
                  <p>
                    We will never show them to anyone, including our own staff.
                    You can delete them at any time from this page, and doing so
                    stops automatic checking immediately.
                  </p>
                  <p className="text-amber-200/90">
                    If your department&apos;s policy does not permit sharing your CFMS
                    credentials with a third-party service, do not use this
                    feature. Manual bill checking works without storing anything.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-indigo-300/60 mb-1">
                      CFMS username
                    </label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="off"
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-sm focus:outline-none focus:border-indigo-400/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-indigo-300/60 mb-1">
                      CFMS password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 pr-10 rounded-lg bg-black/30 border border-white/15 text-sm focus:outline-none focus:border-indigo-400/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300/60 hover:text-white"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-indigo-300/60 mb-1">
                      Test bill number <span className="normal-case tracking-normal">(optional but recommended)</span>
                    </label>
                    <input
                      value={probeBill}
                      onChange={(e) => setProbeBill(e.target.value)}
                      placeholder="202641165896"
                      className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-sm focus:outline-none focus:border-indigo-400/60"
                    />
                    <p className="text-[10px] text-indigo-300/50 mt-1">
                      We check this one bill to confirm the login works before saving.
                    </p>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-indigo-100 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      I have read the above and agree to my CFMS credentials being
                      stored, encrypted, for automatic bill checking.
                    </span>
                  </label>

                  {error && (
                    <div className="text-xs text-red-200 bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                      {error}
                    </div>
                  )}
                  {ok && (
                    <div className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3">
                      {ok}
                    </div>
                  )}

                  <button
                    onClick={save}
                    disabled={saving || !consented}
                    className="w-full py-2.5 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving && <FaSpinner className="w-3.5 h-3.5 animate-spin" />}
                    {saving ? 'Verifying with CFMS…' : 'Save credentials'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function Page() {
  return <RequireAuth><CfmsSettings /></RequireAuth>
}
