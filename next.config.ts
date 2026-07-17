import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

if (
  process.platform === 'win32' &&
  process.env.NODE_ENV === 'development' &&
  process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const distDir = process.env.NEXT_DIST_DIR?.trim() || '.next'
const disablePwaForWindowsStandalone =
  process.platform === 'win32' && process.env.NEXT_PRIVATE_STANDALONE === 'true'

const config: NextConfig = {
  reactStrictMode: true,
  distDir,
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: disablePwaForWindowsStandalone,
})(config)
