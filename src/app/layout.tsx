import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { jetbrainsMono } from './fonts';
import Header from './components/Header';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorHandlerInit } from '../components/ErrorHandlerInit';
import { homeMetadata } from '../lib/metadata';
import StructuredData from './components/StructuredData';
import * as Sentry from '@sentry/nextjs';

const inter = Inter({ subsets: ['latin'] });

export function generateMetadata(): Metadata {
  return {
    ...homeMetadata(),
    description: 'Backing world-class startups you hear on The Pitch podcast. Venture capital fund with proven track record, investing in breakthrough companies with integrity and transparency.',
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${jetbrainsMono.variable} flex flex-col min-h-screen`}>
        <StructuredData />
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
