import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css'
import Link from "next/link";
import AppNavLinks from '@/components/AppNavLinks'


export const metadata: Metadata = {
  metadataBase: new URL('https://evorupa.rs'),
  title: "EvoRupa - Prijavi probleme u infrastrukturi",
  description: "EvoRupa je aplikacija za prijavu rupa, oštećenja puta i drugih infrastrukturnih problema u Srbiji i Evropi.",
  applicationName: 'EvoRupa',
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
  openGraph: {
    title: 'EvoRupa - Prijavi probleme u infrastrukturi',
    description: 'EvoRupa pomaže građanima da prijave rupe, oštećenja puta i druge infrastrukturne probleme.',
    siteName: 'EvoRupa',
    locale: 'sr_RS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EvoRupa - Prijavi probleme u infrastrukturi',
    description: 'Pronađi i prijavi rupe i druge infrastrukturne probleme uz EvoRupa.',
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
