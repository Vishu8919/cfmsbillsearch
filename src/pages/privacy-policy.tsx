// src/pages/privacy-policy.tsx
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | CFMS Bills Status</title>
        <meta
          name="description"
          content="Privacy Policy for CFMS Bills Status — Learn how we handle your data, cookies, and Google AdSense advertising on cfmsbillsstatus.online."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/privacy-policy" />
      </Head>

      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 relative"
        style={{ minHeight: '100dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">

          {/* Back link */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors"
            >
              ← Back to Home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
              Privacy Policy
            </h1>
            <p className="mt-2 text-indigo-200/60 text-sm">
              Last updated: <strong className="text-indigo-300/80">June 15, 2026</strong>
            </p>
            <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
          </motion.div>

          {/* Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 text-indigo-100/80 space-y-8"
          >
            <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
              This Privacy Policy describes how <strong className="text-white">CFMS Bills Status</strong> (
              <a href="https://www.cfmsbillsstatus.online" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                www.cfmsbillsstatus.online
              </a>
              ) collects, uses, and protects information when you use our website.
            </p>

            <div className="h-px bg-white/5"></div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">1</span>
                Information We Collect
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                You can check a single bill on the home page <strong className="text-white">without
                creating an account</strong>, and without providing any personal information.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If you choose to <strong className="text-white">create an account</strong> (required
                only for features such as bulk checking and cross-device history), we store the
                account details you provide — your <strong className="text-white">username</strong>,
                a securely hashed <strong className="text-white">password</strong>, and your{' '}
                <strong className="text-white">security questions</strong> used for password recovery.
                Your password is never stored in plain text.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Your <strong className="text-white">bill search history</strong> is saved in your
                browser for quick access. When you are logged in, it is also synced to your account so
                it is available across your devices. You can delete individual entries, or your saved
                history, at any time.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 2 — CFMS credentials & OTP (bulk checker) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">2</span>
                Your CFMS Credentials &amp; OTP
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                The <strong className="text-white">bulk bill checker</strong> asks for your official
                CFMS username and password so it can fetch the status of your bills on your behalf.
                We want to be completely clear about how this is handled:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-indigo-200/70">
                <li>
                  <strong className="text-white">We do not store your CFMS username or password.</strong>{' '}
                  They are used only in memory to retrieve your bill statuses for that request, and are
                  discarded immediately afterwards. They are never written to our database or saved in
                  our logs.
                </li>
                <li>
                  <strong className="text-white">We never ask for your CFMS OTP.</strong> Sensitive
                  actions on the official CFMS portal are protected by a one-time password (OTP) sent
                  directly to you. We do not request, receive, or handle your OTP at any point.
                </li>
                <li>
                  Your CFMS credentials are <strong className="text-white">never shared</strong> with
                  any third party or used for any purpose other than fetching the bill statuses you ask
                  for.
                </li>
              </ul>
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-200/70 leading-relaxed">
                <strong className="text-yellow-300">Please note:</strong> your CFMS credentials are your
                responsibility. As a general safety practice, only enter them on services you trust, and
                never share your password or OTP with anyone.
              </div>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">3</span>
                Log Data
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Our hosting provider (Render) may automatically collect standard server log data when
                you visit our site. This may include your IP address, browser type, pages visited, and
                time of visit. This data is used solely for server administration and security and is
                not linked to any personal identity.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 3 — AdSense (critical for approval) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">4</span>
                Google AdSense &amp; Cookies
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                We use <strong className="text-white">Google AdSense</strong> to display advertisements.
                Google AdSense uses cookies and web beacons to serve ads based on your prior visits to
                our website and other websites on the internet.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                You may opt out of personalised advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Google Ads Settings
                </a>{' '}
                or{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  aboutads.info
                </a>
                . For more information:{' '}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  How Google uses data from partner sites
                </a>
                .
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">5</span>
                Third-Party Links
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Our website redirects users to the official AP CFMS portal (
                <code className="bg-white/10 px-1 rounded text-indigo-300 text-xs">prdcfms.apcfss.in</code>
                ) operated by the Government of Andhra Pradesh. We have no control over that sites
                content or privacy practices.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">6</span>
                Childrens Privacy
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Our website is not directed at children under the age of 13. We do not knowingly
                collect personal information from children.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">7</span>
                Changes to This Policy
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                We may update this Privacy Policy from time to time. Changes will be posted on this
                page with an updated revision date.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 7 — Contact */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">8</span>
                Contact
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-1 text-indigo-200/70">
                <p>
                  <span className="text-indigo-300/60">Website: </span>
                  <a href="https://www.cfmsbillsstatus.online" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    www.cfmsbillsstatus.online
                  </a>
                </p>
                <p>
                  <span className="text-indigo-300/60">Email: </span>
                  <a href="mailto:vishnuthulasi9699@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all">
                    vishnuthulasi9699@gmail.com
                  </a>
                </p>
                <p>
                  <span className="text-indigo-300/60">Owner: </span>
                  <strong className="text-white">Vishnu Thulasi</strong>
                </p>
              </div>
            </section>

            {/* Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-200/70 leading-relaxed">
              <strong className="text-yellow-300">Disclaimer:</strong> This is an unofficial helper
              tool and is not affiliated with, endorsed by, or connected to the Andhra Pradesh
              government, APCFSS, or any government body.
            </div>

          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-xs text-indigo-200/50 space-y-2"
          >
            <p>© 2026 Vishnu Thulasi <br/> This website was designed by Vishnu Thulasi </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                Home
              </Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/about" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                About
              </Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/articles" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                Articles
              </Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/contact" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                Contact
              </Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/terms" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                Terms
              </Link>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  )
}
