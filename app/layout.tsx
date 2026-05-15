import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GDeRupa - Prijavi probleme u infrastrukturi",
  description: "Aplikacija za prijavu problema u infrastrukturi Srbije",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body className="antialiased">
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:text-blue-200">
              GDeRupa
            </Link>
            <div className="space-x-4">
              <Link href="/map" className="hover:text-blue-200 transition">
                Mapa
              </Link>
              <Link href="/report" className="hover:text-blue-200 transition">
                Prijavi problem
              </Link>
              <Link href="/admin" className="hover:text-blue-200 transition">
                Admin
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
