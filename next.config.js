/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'africartz.xyz',
      },
      {
        protocol: 'https',
        hostname: 'api.africartz.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Allow unoptimized images for external domains that might fail
    unoptimized: false,
  },
}

module.exports = nextConfig
