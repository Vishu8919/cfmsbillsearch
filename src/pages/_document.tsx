import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── Primary SEO Meta Tags ── */}
        <meta charSet="UTF-8" />
        <meta
          name="description"
          content="Check Andhra Pradesh CFMS bill status online instantly. Search AP treasury payment status, pending bills, and payment releases using bill number. Fast and free CFMS bill tracker."
        />
        <meta
          name="keywords"
          content="CFMS bill status, AP CFMS, Andhra Pradesh CFMS, CFMS bills Status, AP treasury payment status, CFMS bill tracker, apcfss bill status, AP government bills, treasury pending bills, CFMS payment status"
        />
        <meta name="author" content="Vishnu Thulasi" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://www.cfmsbillsstatus.online/" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#4f46e5" />

        {/* ── Open Graph (for social sharing & richer Google previews) ── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.cfmsbillsstatus.online/" />
        <meta
          property="og:title"
          content="AP CFMS Bill Status Checker – Andhra Pradesh Treasury Bills"
        />
        <meta
          property="og:description"
          content="Instantly check your Andhra Pradesh CFMS bill and payment status. Search by bill number and year. Free AP treasury bill tracker."
        />
        <meta property="og:site_name" content="CFMS Bills Status" />
        <meta property="og:locale" content="en_IN" />

        {/* ── Twitter Card ── */}
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="AP CFMS Bill Status Checker – Andhra Pradesh Treasury Bills"
        />
        <meta
          name="twitter:description"
          content="Instantly check your Andhra Pradesh CFMS bill and payment status. Search by bill number and year."
        />

        {/* ── Geo targeting for India / AP ── */}
        <meta name="geo.region" content="IN-AP" />
        <meta name="geo.placename" content="Andhra Pradesh" />
        <meta name="geo.position" content="15.9129;79.7400" />
        <meta name="ICBM" content="15.9129, 79.7400" />

        {/* ── Structured Data: WebSite + SearchAction (enables Google Sitelinks search box) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CFMS Bills Status",
              url: "https://www.cfmsbillsstatus.online/",
              description:
                "Check Andhra Pradesh CFMS bill status and treasury payment status online.",
              inLanguage: "en-IN",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.cfmsbillsstatus.online/?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* ── Structured Data: WebApplication ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "AP CFMS Bill Status Checker",
              url: "https://www.cfmsbillsstatus.online/",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any",
              description:
                "Search and track Andhra Pradesh CFMS bills and treasury payment status. Enter your bill number to check payment status instantly.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "INR",
              },
            }),
          }}
        />

        {/* ── Google AdSense ── */}
        {/* IMPORTANT: Replace ca-pub-XXXXXXXXXXXXXXXX with your real AdSense Publisher ID */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
