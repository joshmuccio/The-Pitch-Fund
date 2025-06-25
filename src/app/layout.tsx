import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from './components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Pitch Fund',
  description: 'Backing founders you hear on The Pitch.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-graphite-gray text-xs py-6 text-center">
          © {new Date().getFullYear()} The Pitch Fund
        </footer>
      </body>
    </html>
  );
}
