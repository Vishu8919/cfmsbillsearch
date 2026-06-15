// src/pages/contact.tsx
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us | CFMS Bills Status</title>
        <meta
          name="description"
          content="Get in touch with CFMS Bills Status. Contact us with questions, feedback, or suggestions about the Andhra Pradesh CFMS bill status checker tool."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/contact" />
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
            <Link href="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
              ← Back to Home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tighter">
              Contact Us
            </h1>
            <p className="mt-2 text-indigo-200/60 text-sm sm:text-base">
              Questions, feedback, or suggestions? We&#39;d like to hear from you.
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
            <section className="space-y-3">
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                <strong className="text-white">CFMS Bills Status</strong> is a free tool that
                helps Andhra Pradesh government employees and Drawing and Disbursing Officers
                check their CFMS bill status quickly. If you have a question about how the
                tool works, a suggestion to improve it, or feedback to share, please reach
                out using the email below.
              </p>
            </section>

            {/* Email card */}
            <section className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-5 sm:p-6 text-center">
              <p className="text-sm text-indigo-300/70 mb-2">Email us at</p>
              <a
                href="mailto:vishnuthulasi9699@gmail.com"
                className="text-base sm:text-lg font-semibold text-white hover:text-indigo-200 underline underline-offset-4 break-all"
              >
                vishnuthulasi9699@gmail.com
              </a>
              <p className="text-xs text-indigo-200/50 mt-3">
                We read every message and aim to respond within a few days.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* What we can help with */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">What we can help with</h2>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-indigo-200/70">
                <li>Questions about how to use the bill status checker</li>
                <li>Technical problems with the website or features</li>
                <li>Suggestions for new features or improvements</li>
                <li>Feedback about the guides and articles</li>
                <li>General queries about this tool</li>
              </ul>
            </section>

            <div className="h-px bg-white/5"></div>

            {/* What we can't help with */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">What we cannot help with</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Please note that this is an <strong className="text-white">unofficial tool</strong>{' '}
                and we are not part of the Andhra Pradesh government or APCFSS. We cannot
                process, approve, release, or change the status of any bill, and we have no
                access to individual bill records beyond the public status shown by the
                official portal.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-200/70 leading-relaxed">
                <strong className="text-yellow-300">For specific bill issues</strong> — such as a
                delayed payment, an objection, or a rejection — please contact your DDO or
                your office accounts/establishment section. They have direct access to the
                full bill details inside CFMS and can take action on your behalf.
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
            <p>© 2026 Vishnu Thulasi <br /> This website was designed by Vishnu Thulasi</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Home</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/about" className="hover:text-indigo-300 transition-colors underline underline-offset-2">About</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/articles" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Articles</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/privacy-policy" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Privacy</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/terms" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Terms</Link>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  )
}
