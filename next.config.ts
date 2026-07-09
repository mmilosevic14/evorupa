import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const distDir = process.env.NEXT_DIST_DIR?.trim() || '.next'

const config: NextConfig = {
  reactStrictMode: true,
  distDir,
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
})(config)
