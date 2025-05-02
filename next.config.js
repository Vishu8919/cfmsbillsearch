/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // Enables static export
  images: {
    unoptimized: true // Required for static exports
  },
  // Optional optimizations
  compress: true,
  productionBrowserSourceMaps: false
};

module.exports = nextConfig;