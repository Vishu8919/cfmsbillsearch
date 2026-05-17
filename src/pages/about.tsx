// src/pages/about.tsx
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function About() {
  return (
    <>
      <Head>
        <title>About CFMS Bill Status Checker | How to Use | AP CFMS</title>
        <meta
          name="description"
          content="Learn what Andhra Pradesh CFMS is, how to check your CFMS bill status online, and how to use this free AP treasury payment status checker tool."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/about" />
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
              About CFMS Bill Status
            </h1>
            <p className="mt-2 text-indigo-200/60 text-sm">
              Everything you need to know about AP CFMS and how to use this tool
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

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">1</span>
                What is AP CFMS?
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                The <strong className="text-white">Andhra Pradesh CFMS</strong> (Comprehensive Financial
                Management System) is the official treasury system used by the AP state government to
                manage all government payments and bills. It is operated by{' '}
                <strong className="text-white">APCFSS</strong> (Andhra Pradesh Centre for Financial
                Systems and Services).
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Government employees, Drawing and Disbursing Officers (DDOs), and treasury officials use
                CFMS to submit bills, track payment status, and view releases from the AP treasury.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">2</span>
                How to Check CFMS Bill Status
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                You can check your bill status in two ways using this tool:
              </p>

              <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-indigo-300">Method 1 — Paste Full Bill Number</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-indigo-200/70">
                  <li>Copy your full bill number from any source (e.g. <code className="bg-white/10 px-1 rounded text-indigo-300 text-xs">2026-2575612</code>)</li>
                  <li>Paste it into the <em>Enter Full Bill Number</em> field on the home page</li>
                  <li>Tap the paste icon or type it in and click <strong className="text-white">Search Bill</strong></li>
                  <li>The official CFMS portal will open with your bill status</li>
                </ol>
              </div>

              <div className="bg-purple-900/30 border border-purple-500/20 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-purple-300">Method 2 — Enter Year + Bill Number Separately</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-indigo-200/70">
                  <li>Enter the financial year (e.g. <code className="bg-white/10 px-1 rounded text-indigo-300 text-xs">2026</code>) in the Year field</li>
                  <li>Enter your bill number (e.g. <code className="bg-white/10 px-1 rounded text-indigo-300 text-xs">2575612</code>) in the Bill Number field</li>
                  <li>Click <strong className="text-white">Search Bill</strong></li>
                  <li>The official CFMS portal opens directly with your bill status</li>
                </ol>
              </div>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">3</span>
                Search History Feature
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Every bill you search is automatically saved to your <strong className="text-white">local search history</strong> — accessible via the history button (top right). You can:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-indigo-200/70">
                <li>Re-open any previous bill in one tap</li>
                <li>Rename bills for easy identification (e.g. &quot;April Salary&quot;, &quot;TA Bill&quot;)</li>
                <li>Delete individual entries</li>
              </ul>
              <p className="text-sm text-indigo-200/50">
                History is stored only on your device (browser localStorage). Nothing is sent to our servers.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm text-indigo-300 flex-shrink-0">4</span>
                About This Tool
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                This is a free, unofficial helper tool that provides a simplified interface to access
                the official AP CFMS bill status portal. It is built and maintained by{' '}
                <strong className="text-white">Vishnu Thulasi</strong>.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-200/70 leading-relaxed">
                <strong className="text-yellow-300">Disclaimer:</strong> This tool is not affiliated with,
                endorsed by, or connected to the Andhra Pradesh government or APCFSS. All bill status
                information is fetched directly from the official CFMS portal (prdcfms.apcfss.in).
              </div>
            </section>

          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-xs text-indigo-200/50 space-y-2"
          >
            <p>© 2026 Vishnu Thulasi</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                Home
              </Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/privacy-policy" className="hover:text-indigo-300 transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  )
}
