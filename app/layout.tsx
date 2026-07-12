import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css'
import Link from "next/link";
import AppNavLinks from '@/components/AppNavLinks'

export const metadata: Metadata = {
  metadataBase: new URL('https://evorupa.rs'),
  title: {
    default: 'EvoRupa - Prijavi rupe i infrastrukturne probleme',
    template: '%s | EvoRupa',
  },
  description: 'EvoRupa je građanska platforma za prijavu rupa, oštećenja puta i drugih infrastrukturnih problema u Srbiji.',
  applicationName: 'EvoRupa',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body className="antialiased">
        <nav className="bg-secondary text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:text-blue-100">
              EvoRupa
            </Link>
            <AppNavLinks />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
