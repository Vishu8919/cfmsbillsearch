// src/pages/refund-policy.tsx
//
// Refund & Cancellation policy. Required by Razorpay's KYC review, which checks
// the live site for a policy stating refund conditions and processing times.
//
// The terms stated here are a public commitment. Do not soften or reword them
// without also updating what the checkout screen tells the user at the moment
// they pay — the two must agree.
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function RefundPolicy() {
  return (
    <>
      <Head>
        <title>Refund &amp; Cancellation Policy | CFMS Bills Status</title>
        <meta
          name="description"
          content="Refund and cancellation policy for CFMS Bills Status Pro subscriptions — refund window, cancellation of automatic renewals, and processing timelines."
        />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/refund-policy" />
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
              Refund &amp; Cancellation Policy
            </h1>
            <p className="mt-2 text-indigo-200/60 text-sm">
              Last updated: <strong className="text-indigo-300/80">August 29, 2026</strong>
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
              This policy covers paid Pro subscriptions on{' '}
              <strong className="text-white">cfmsbillsstatus.online</strong>. The free
              plan involves no payment, so nothing here applies to it. Payments are
              processed by Razorpay; we do not receive or store your card, UPI or bank
              details at any point.
            </p>

            <div className="h-px bg-white/5"></div>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">1. Refund window</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If Pro is not what you expected, you can ask for a full refund within{' '}
                <strong className="text-white">7 days of your first Pro purchase</strong>.
                Write to us from the email address on your account and we will refund the
                whole amount. You do not need to give a reason.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                This 7-day window applies to your first purchase only. Renewals — whether
                paid manually or charged automatically — are not refundable, because you
                are told before each renewal and can cancel beforehand.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">2. Duplicate and failed payments</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If you are charged twice for the same period, or money leaves your account
                but Pro is not activated, tell us and we will refund it in full. This is
                not subject to the 7-day window and applies at any time.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                A payment that fails at the bank is usually reversed automatically by your
                bank within 5 to 7 working days without any action from us.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">3. Cancelling automatic renewal</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If you chose automatic renewal, you can cancel at any time from your
                account settings. There is no cancellation fee and you do not need to
                contact us to do it.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Cancelling stops all future charges. It does{' '}
                <strong className="text-white">not</strong> refund the period you are
                currently in — Pro stays active until that period ends, and then your
                account returns to the free plan. Nothing is deleted when this happens:
                your saved batches, tracked bills and history stay where they are, and
                the free plan&apos;s limits apply only to adding new ones.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Before every automatic charge, you receive a notification at least 24
                hours in advance, as required by the Reserve Bank of India. You can also
                cancel the mandate directly in your UPI app or with your bank.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">4. How refunds are paid</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Approved refunds go back to the original payment method — the same card,
                UPI ID or bank account you paid from. We cannot send a refund anywhere
                else.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                We start the refund within{' '}
                <strong className="text-white">2 working days</strong> of approving your
                request. It then usually takes{' '}
                <strong className="text-white">5 to 7 working days</strong> to appear in
                your account, depending on your bank. Pro access ends when the refund is
                started.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">5. Government staff discount</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                The discounted rate for verified Andhra Pradesh government staff applies
                from the point your verification is approved onwards. It is not applied
                backwards, and we do not refund the difference on a subscription you
                bought at the standard rate before being verified.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If verification is refused, you keep whatever subscription you have
                already paid for at the standard rate. Nothing is charged for
                verification itself, whatever the outcome.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">6. Service interruptions</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                This site reads from the official Andhra Pradesh CFMS portal, which is
                operated by the government and not by us. If that portal is down, slow or
                changes without notice, parts of this service may stop working for a
                while. We do not refund for outages caused by the CFMS portal, because it
                is outside our control.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                If our own service is unavailable for an extended period, write to us and
                we will extend your subscription by the time you lost.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">7. How to request a refund</h2>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                Email{' '}
                <a
                  href="mailto:vishnuthulasi9699@gmail.com"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  vishnuthulasi9699@gmail.com
                </a>{' '}
                from the address registered on your account, with the payment reference
                shown on your Razorpay receipt. We reply within 2 working days.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-indigo-200/70">
                You can also reach us through the{' '}
                <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  contact page
                </Link>
                .
              </p>
            </section>

            <div className="h-px bg-white/5"></div>

            <p className="text-xs text-indigo-300/50 leading-relaxed">
              This policy may change. The version in force is the one published on this
              page on the day you pay, and changes are never applied backwards to a
              purchase you have already made.
            </p>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-10 text-center text-xs text-indigo-200/50"
          >
            <div className="flex items-center justify-center flex-wrap gap-y-2">
              <Link href="/about" className="hover:text-indigo-300 transition-colors underline underline-offset-2">About</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/pricing" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Pricing</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/contact" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Contact</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/privacy-policy" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Privacy</Link>
              <span className="mx-3 text-indigo-200/20">•</span>
              <Link href="/terms" className="hover:text-indigo-300 transition-colors underline underline-offset-2">Terms</Link>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  )
}
