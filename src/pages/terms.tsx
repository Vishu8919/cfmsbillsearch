// src/pages/terms.tsx
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | CFMS Bills Status</title>
        <meta
          name="description"
          content="Terms of Service for CFMS Bills Status — the rules and conditions for using our free Andhra Pradesh CFMS bill status checker tool."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/terms" />
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
              Terms of Service
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
            These Terms of Service (&quot;Terms&quot;) govern your use of the website
            <strong className="text-white"> cfmsbillsstatus.online</strong>
            (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            By accessing or using the Service, you agree to be bound by these Terms.
            If you do not agree, please do not use the Service.
          </p>
            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">1. About the Service</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                CFMS Bills Status is a free, unofficial tool that provides a simplified
                interface for checking Andhra Pradesh CFMS (Comprehensive Financial
                Management System) bill statuses. The Service helps you reach the official
                CFMS bill status page using your bill number and offers convenience features
                such as search history and bulk checking.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-200/70 leading-relaxed">
                <strong className="text-yellow-300">Not an official government service:</strong>{' '}
                We are not affiliated with, endorsed by, or connected to the Andhra Pradesh
                government or APCFSS. All bill status information originates from the official
                CFMS portal (prdcfms.apcfss.in).
              </div>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">2. Acceptable use</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                You agree to use the Service only for lawful purposes and in a way that does
                not infringe the rights of others. Specifically, you agree not to:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-indigo-200/70">
                <li>Use the Service for any unlawful or fraudulent activity.</li>
                <li>Attempt to disrupt, overload, or damage the Service or its infrastructure.</li>
                <li>Attempt to gain unauthorised access to any part of the Service or its data.</li>
                <li>Use automated systems to access the Service in a way that places undue load on it.</li>
                <li>Misuse another person&apos;s bill information or account.</li>
              </ul>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">3. Accounts</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
              We may update these Terms from time to time. Changes take effect when posted
              on this page, and the &quot;Last updated&quot; date above will reflect the most
              recent revision. Continued use of the Service after changes means you accept
              the revised Terms.
            </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">4. Accuracy of information</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Bill status information is retrieved from the official CFMS portal. While we
                aim to present it faithfully, we do not control that data and cannot
                guarantee that it is always accurate, complete, or up to date. The official
                CFMS portal remains the authoritative source. Do not rely solely on this
                Service for critical financial decisions — verify important information
                through official channels.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">5. Availability</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
              We provide the Service on an &quot;as is&quot; and &quot;as available&quot; basis.
              We may modify, suspend, or discontinue any part of the Service at any time
              without notice. The Service also depends on the official CFMS portal, which
              may be unavailable or undergoing maintenance at times outside our control.
            </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">6. Limitation of liability</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                To the fullest extent permitted by law, the Service and its operator shall not
                be liable for any direct, indirect, incidental, or consequential damages
                arising from your use of, or inability to use, the Service. This includes any
                losses related to delayed, missing, or incorrect bill or payment information,
                which is governed by the official CFMS system and the treasury, not by us.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">7. Advertising</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                The Service may display advertisements served by third parties, including
                Google AdSense. These advertisements help keep the Service free. Your
                interactions with advertisers are solely between you and the advertiser. For
                details on how advertising data is handled, please see our{' '}
                <Link href="/privacy-policy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  Privacy Policy
                </Link>.
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">8. Changes to these Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
              We may update these Terms from time to time. Changes take effect when posted
              on this page, and the &quot;Last updated&quot; date above will reflect the most
              recent revision. Continued use of the Service after changes means you accept
              the revised Terms.
            </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">9. Contact</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:vishnuthulasi9699@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all">
                  vishnuthulasi9699@gmail.com
                </a>{' '}
                or visit our{' '}
                <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  contact page
                </Link>.
              </p>
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
              <Link href="/contact" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Contact</Link>
              <span className="text-indigo-200/20">·</span>
              <Link href="/privacy-policy" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Privacy</Link>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  )
}
