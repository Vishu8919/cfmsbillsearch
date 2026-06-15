// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Generates the 'out' folder — required for Render Static Site hosting
  eslint: {
    // Content pages contain ordinary prose (apostrophes, quotes). Linting still
    // runs in development; we just don't want stylistic lint rules to block a
    // production build/deploy.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
