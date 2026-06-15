// src/components/ArticleLayout.tsx
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ArticleLayoutProps {
  title: string           // <title> tag + H1
  description: string     // meta description
  canonicalPath: string   // e.g. /articles/cfms-bill-status-meaning
  subtitle?: string       // small line under the H1
  updated?: string        // "Last updated" date
  readingTime?: string    // e.g. "7 min read"
  children: ReactNode
}

export default function ArticleLayout({
  title,
  description,
  canonicalPath,
  subtitle,
  updated = 'June 2026',
  readingTime,
  children,
}: ArticleLayoutProps) {
  const canonical = `https://www.cfmsbillsstatus.online${canonicalPath}`
  return (
    <>
      <Head>
        <title>{title} | CFMS Bills Status</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        {/* Article structured data for richer Google results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: title,
              description: description,
              author: { '@type': 'Person', name: 'Vishnu Thulasi' },
              publisher: {
                '@type': 'Organization',
                name: 'CFMS Bills Status',
              },
              mainEntityOfPage: canonical,
              inLanguage: 'en-IN',
            }),
          }}
        />
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

          {/* Breadcrumb / back links */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 text-sm text-indigo-300/80 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-indigo-200/30">/</span>
              <Link href="/articles" className="hover:text-white transition-colors">Articles</Link>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tight leading-snug">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-indigo-200/70 text-sm sm:text-base leading-relaxed">{subtitle}</p>
            )}
            <div className="mt-4 flex items-center gap-3 text-xs text-indigo-300/50">
              <span>Updated {updated}</span>
              {readingTime && (
                <>
                  <span className="text-indigo-200/20">•</span>
                  <span>{readingTime}</span>
                </>
              )}
            </div>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-indigo-400/50 to-purple-400/50 rounded-full"></div>
          </motion.div>

          {/* Article body */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="article-body bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 text-indigo-100/80"
          >
            {children}
          </motion.article>

          {/* Try-the-tool CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-white/10 rounded-2xl p-6 text-center"
          >
            <h2 className="text-lg font-semibold text-white mb-2">Check your CFMS bill status now</h2>
            <p className="text-sm text-indigo-200/70 mb-4">
              Use the free tool to look up any Andhra Pradesh CFMS bill by its number.
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all text-sm font-medium"
            >
              Open Bill Status Checker →
            </Link>
          </motion.div>

          {/* Related links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-8"
          >
            <h2 className="text-sm font-semibold text-indigo-300/80 mb-3 uppercase tracking-wide">
              More CFMS guides
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <Link href="/articles/cfms-bill-status-meaning" className="text-sm text-indigo-200/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2 transition-all">
                What CFMS bill statuses mean
              </Link>
              <Link href="/articles/why-cfms-bill-rejected" className="text-sm text-indigo-200/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2 transition-all">
                Why a CFMS bill gets rejected
              </Link>
              <Link href="/articles/cfms-guide-for-employees" className="text-sm text-indigo-200/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2 transition-all">
                CFMS guide for AP employees
              </Link>
              <Link href="/articles/cfms-bill-status-faq" className="text-sm text-indigo-200/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2 transition-all">
                CFMS bill status FAQ
              </Link>
            </div>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center text-xs text-indigo-200/50 space-y-2"
          >
            <p>© 2026 Vishnu Thulasi <br /> This website was designed by Vishnu Thulasi</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Home</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/articles" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Articles</Link>
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

        {/* Shared prose styling for article bodies */}
        <style jsx global>{`
          .article-body h2 {
            font-size: 1.25rem;
            line-height: 1.75rem;
            font-weight: 600;
            color: #fff;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
          }
          .article-body h3 {
            font-size: 1.05rem;
            font-weight: 600;
            color: #e0e7ff;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .article-body p {
            font-size: 0.95rem;
            line-height: 1.7;
            color: rgba(199, 210, 254, 0.75);
            margin-bottom: 1rem;
          }
          .article-body ul,
          .article-body ol {
            margin: 0 0 1rem 0;
            padding-left: 1.25rem;
            color: rgba(199, 210, 254, 0.75);
            font-size: 0.95rem;
            line-height: 1.7;
          }
          .article-body ul { list-style: disc; }
          .article-body ol { list-style: decimal; }
          .article-body li { margin-bottom: 0.4rem; }
          .article-body strong { color: #fff; }
          .article-body a {
            color: #a5b4fc;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .article-body a:hover { color: #fff; }
          .article-body code {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.1rem 0.35rem;
            border-radius: 0.25rem;
            font-size: 0.85em;
            color: #c7d2fe;
          }
          .article-body table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.25rem;
            font-size: 0.875rem;
          }
          .article-body th,
          .article-body td {
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 0.6rem 0.75rem;
            text-align: left;
            color: rgba(199, 210, 254, 0.8);
          }
          .article-body th {
            background: rgba(99, 102, 241, 0.2);
            color: #fff;
            font-weight: 600;
          }
          .article-body .note {
            background: rgba(99, 102, 241, 0.15);
            border: 1px solid rgba(99, 102, 241, 0.25);
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1.25rem;
            font-size: 0.9rem;
          }
          .article-body .warn {
            background: rgba(234, 179, 8, 0.12);
            border: 1px solid rgba(234, 179, 8, 0.25);
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1.25rem;
            font-size: 0.9rem;
            color: rgba(254, 240, 138, 0.8);
          }
          .article-body .warn strong { color: #fde047; }
        `}</style>
      </main>
    </>
  )
}
