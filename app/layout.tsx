import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://www.afrotechcuts.co.uk';

const title = 'AFROTECHCUTS — Barbers Who Know Afro Hair';
const description = 'Discover Black barbers near you who specialise in Afro hair — fades, locs, twists, and cornrows. Browse their work, get AI-powered style matches, and book in seconds.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: 'black barber, afro hair, natural hair, locs, twists, cornrows, fade, braids, booking, London, UK',
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'AFROTECHCUTS',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
