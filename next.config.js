// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️  REMOVED `output: 'export'` — static export breaks proper SSR meta tag rendering.
  // Render supports Node.js servers so SSR works fine. Remove this line if it was there.

  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Content-Type', value: 'application/xml' }],
      },
      {
        source: '/robots.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain' }],
      },
    ]
  },
}

module.exports = nextConfig
