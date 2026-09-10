// src/pages/bill-search.tsx — retired page, kept as a redirect.
//
// The single-bill search this page offered is the main event on the home page,
// so this was a second, plainer copy of something the user had just been
// handed. It has been removed from navigation entirely.
//
// WHY THIS FILE STILL EXISTS instead of just being deleted:
//
//   1. It is a live, indexed URL with organic search traffic. Deleting the
//      file means the build stops emitting bill-search.html, and every
//      bookmark and search result starts returning a hard 404.
//
//   2. `output: 'export'` produces static files with no server, so there is
//      nowhere to configure a server-side 301 in the app itself.
//
// So the page stays and immediately forwards to /. Users land where they meant
// to go, and crawlers see noindex plus a canonical pointing home.
//
// THE PROPER FIX IS A 301 AT THE EDGE. Add a redirect rule in the Render
// dashboard for this static site: /bill-search -> / (301 permanent). That
// passes the accumulated ranking signal to the home page, which a client-side
// redirect only does weakly. Once that rule is live, this file can be deleted.
//
// Nothing is lost from users' saved data: this page and the home page both
// read and write the same `billHistory` localStorage key, so the search
// history is already visible from the home page's history button.
import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BillSearchRetired() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <>
      <Head>
        <title>CFMS Bill Status — Search Your Bill</title>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/" />
      </Head>

      <main
        className="bg-gradient-to-br from-gray-900 via-indigo-900 to-violet-900 relative flex items-center justify-center"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="relative z-10 text-center px-4">
          <div className="w-10 h-10 mx-auto mb-4 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-indigo-200/70 text-sm">
            Bill search now lives on the home page. Taking you there&hellip;
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Go now
          </Link>
        </div>
      </main>
    </>
  )
}
