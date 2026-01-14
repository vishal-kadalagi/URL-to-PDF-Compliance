/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable server components if needed
  },
  // Increase body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: '100mb'
  }
};

module.exports = nextConfig;