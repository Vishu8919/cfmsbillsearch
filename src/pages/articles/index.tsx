// src/pages/articles/index.tsx
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

const articles = [
  {
    slug: 'how-to-check-cfms-bill-status',
    title: 'How to Check Your CFMS Bill Status Online',
    desc: 'A step-by-step guide to looking up any AP treasury bill by its number, using both entry methods.',
    tag: 'Getting started',
    time: '7 min',
  },
  {
    slug: 'bulk-cfms-bill-check-guide',
    title: 'How to Check Multiple CFMS Bills at Once',
    desc: 'Use the bulk checker to look up to 30 bills together, see payment details, export to CSV, and save batches.',
    tag: 'Getting started',
    time: '7 min',
  },
  {
    slug: 'cfms-bill-status-meaning',
    title: 'What Each CFMS Bill Status Means',
    desc: 'Pending, Passed, Returned, Rejected, Released — every status explained, and what to do next.',
    tag: 'Reference',
    time: '8 min',
  },
  {
    slug: 'cfms-guide-for-employees',
    title: 'CFMS for AP Government Employees',
    desc: 'How your salary and allowance bills flow through CFMS, and how to track your own payments.',
    tag: 'Guide',
    time: '9 min',
  },
  {
    slug: 'why-cfms-bill-rejected',
    title: 'Why a CFMS Bill Gets Rejected or Returned',
    desc: 'The common causes of objections and rejections, with a practical fix and checklist for each.',
    tag: 'Troubleshooting',
    time: '9 min',
  },
  {
    slug: 'cfms-guide-for-ddos',
    title: 'CFMS Guide for DDOs',
    desc: 'Submitting and tracking bills efficiently, avoiding objections, and handling returns.',
    tag: 'For DDOs',
    time: '9 min',
  },
  {
    slug: 'ap-treasury-payment-releases',
    title: 'Understanding AP Treasury Payment Releases',
    desc: 'Why a passed bill is not the same as money in the bank, and what affects release timing.',
    tag: 'Reference',
    time: '7 min',
  },
  {
    slug: 'cfms-vs-apcfss-vs-treasury',
    title: "CFMS vs APCFSS vs Treasury: What's the Difference?",
    desc: 'The three terms that come up constantly around AP payments, and how they fit together.',
    tag: 'Explainer',
    time: '6 min',
  },
  {
    slug: 'cfms-object-heads-list',
    title: 'CFMS Object Heads List (DH & SDH Codes)',
    desc: 'The complete list of Detailed and Sub-Detailed Head expenditure codes used in AP government bills.',
    tag: 'Reference',
    time: '12 min',
  },
  {
    slug: 'cfms-bill-submission-schedule',
    title: 'CFMS Bill Submission Schedule',
    desc: 'Which bills must be presented to the Treasury and PAO on which dates of the month.',
    tag: 'Reference',
    time: '6 min',
  },
  {
    slug: 'cfms-bill-status-faq',
    title: 'CFMS Bill Status FAQ',
    desc: '22 common questions about checking and understanding CFMS bills, answered concisely.',
    tag: 'FAQ',
    time: '8 min',
  },
]

export default function ArticlesIndex() {
  return (
    <>
      <Head>
        <title>CFMS Guides &amp; Articles | Andhra Pradesh Bill Status Help</title>
        <meta
          name="description"
          content="Guides and articles about Andhra Pradesh CFMS — how to check bill status, what each status means, why bills get rejected, payment releases, and answers for employees and DDOs."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/articles" />
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
              CFMS Guides &amp; Articles
            </h1>
            <p className="mt-2 text-indigo-200/60 text-sm sm:text-base">
              Everything you need to understand and track Andhra Pradesh CFMS bills
            </p>
            <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
          </motion.div>

          {/* Intro */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-indigo-200/70 leading-relaxed mb-8 text-center"
          >
            Whether you are an employee waiting on a salary bill or a DDO managing dozens of
            claims, these guides explain how the CFMS system works, what each bill status
            means, and how to keep your payments moving. Pick a topic below to get started.
          </motion.p>

          {/* Article list */}
          <div className="space-y-4">
            {articles.map((a, idx) => (
              <motion.div
                key={a.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
              >
                <Link
                  href={`/articles/${a.slug}`}
                  className="block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 sm:p-6 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium text-indigo-300 bg-indigo-500/20 border border-indigo-400/20 rounded-full px-3 py-0.5">
                      {a.tag}
                    </span>
                    <span className="text-xs text-indigo-300/50">{a.time} read</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
                    {a.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-indigo-200/70 leading-relaxed">{a.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-300 group-hover:text-white transition-colors">
                    Read guide
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-white/10 rounded-2xl p-6 text-center"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Ready to check a bill?</h2>
            <p className="text-sm text-indigo-200/70 mb-4">
              Look up any AP CFMS bill status instantly with your bill number.
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all text-sm font-medium"
            >
              Open Bill Status Checker →
            </Link>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-10 text-center text-xs text-indigo-200/50 space-y-2"
          >
            <p>© 2026 Vishnu Thulasi <br /> This website was designed by Vishnu Thulasi</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Home</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/about" className="hover:text-indigo-300 transition-colors underline underline-offset-2">About</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/contact" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Contact</Link>
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
