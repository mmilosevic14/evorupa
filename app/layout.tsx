import type { Metadata } from "next";
import { cookies } from 'next/headers'
import "./globals.css";
import 'leaflet/dist/leaflet.css'
import Link from "next/link";
import AppNavLinks from '@/components/AppNavLinks'
import ClientCacheReset from '@/components/ClientCacheReset'
import ConsentManager from '@/components/ConsentManager'
import PwaInstallPrompt from '@/components/PwaInstallPrompt'
import { CONSENT_COOKIE_NAME, GTM_ID, parseConsentState } from '@/lib/consent'

export const metadata: Metadata = {
  metadataBase: new URL('https://evorupa.pages.dev'),
  title: {
    default: 'EvoRupa - Prijavi rupe i infrastrukturne probleme',
    template: '%s | EvoRupa',
  },
  description: 'EvoRupa je građanska platforma za prijavu rupa, oštećenja puta i drugih infrastrukturnih problema u Srbiji.',
  applicationName: 'EvoRupa',
  manifest: '/manifest.json',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'EvoRupa',
    'EvoJeRupa',
    'Evo Je Rupa',
    'Evo Rupa',
    'Evropa',
    'Europe',
    'prijava rupa',
    'prijava problema na putu',
    'infrastruktura Srbije',
  ],
  authors: [{ name: 'EvoRupa' }],
  creator: 'EvoRupa',
  publisher: 'EvoRupa',
  category: 'civic technology',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'EvoRupa - Prijavi rupe i infrastrukturne probleme',
    description: 'Prijavi rupe, oštećenja puta i druge probleme na infrastrukturi. Pogledaj prijave građana na mapi Srbije.',
    url: '/',
    siteName: 'EvoRupa',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EvoRupa - građanska mapa infrastrukturnih problema',
      },
    ],
    locale: 'sr_RS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EvoRupa - Prijavi rupe i infrastrukturne probleme',
    description: 'Građanska mapa rupa, oštećenja puta i infrastrukturnih problema u Srbiji.',
    images: ['/og-image.png'],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies()
  const initialConsent = parseConsentState(cookieStore.get(CONSENT_COOKIE_NAME)?.value)

  return (
    <html lang="sr">
      <head>
        <meta property="og:logo" content="https://evorupa.pages.dev/logo.png" />
      </head>
      <body className="antialiased">
        {initialConsent === 'accepted' && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <nav className="bg-secondary text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:text-blue-100">
              EvoRupa
            </Link>
            <AppNavLinks />
          </div>
        </nav>
        <ClientCacheReset />
        <PwaInstallPrompt />
        <ConsentManager initialConsent={initialConsent} />
        {children}
      </body>
    </html>
  );
}
