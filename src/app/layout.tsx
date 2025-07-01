import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { jetbrainsMono } from './fonts';
import Header from './components/Header';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorHandlerInit } from '../components/ErrorHandlerInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Pitch Fund | Investing in World-Class Startups from The Pitch',
  description: 'Backing world-class startups you hear on The Pitch podcast. Venture capital fund with proven track record, investing in breakthrough companies with integrity and transparency.',
  keywords: ['venture capital', 'startup funding', 'The Pitch podcast', 'angel investing', 'startup investment fund', 'early stage investing'],
  authors: [{ name: 'The Pitch Fund' }],
  creator: 'The Pitch Fund',
  publisher: 'The Pitch Fund',
  metadataBase: new URL('https://thepitch.fund'),
  alternates: {
    canonical: 'https://thepitch.fund',
  },
  openGraph: {
    title: 'The Pitch Fund | Investing in World-Class Startups',
    description: 'Backing world-class startups you hear on The Pitch podcast. Venture capital fund with proven track record.',
    url: 'https://thepitch.fund',
    siteName: 'The Pitch Fund',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Pitch Fund | Investing in World-Class Startups',
    description: 'Backing world-class startups you hear on The Pitch podcast.',
    creator: '@thepitchshow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${jetbrainsMono.variable} flex flex-col min-h-screen`}>
        <ErrorHandlerInit />
        <ErrorBoundary>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-graphite-gray text-xs py-6 text-center">
            © {new Date().getFullYear()} The Pitch Fund
          </footer>
          <SpeedInsights />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
