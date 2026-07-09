import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const isProductionBuild = process.env.NODE_ENV === 'production'

const config: NextConfig = {
  reactStrictMode: true,
  distDir: isProductionBuild ? '.next-prod' : '.next',
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
