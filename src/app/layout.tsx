import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Load Inter font with optimal subsets and weights
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Pitch Fund - Connecting Innovative Companies with Smart Capital',
  description: 'An investor-grade platform showcasing our portfolio companies and providing secure access for Limited Partners to quarterly metrics and founder updates.',
  keywords: ['venture capital', 'startup funding', 'investment fund', 'portfolio companies', 'LP portal'],
  authors: [{ name: 'The Pitch Fund' }],
  creator: 'The Pitch Fund',
  publisher: 'The Pitch Fund',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://thepitch.fund',
    siteName: 'The Pitch Fund',
    title: 'The Pitch Fund - Connecting Innovative Companies with Smart Capital',
    description: 'An investor-grade platform showcasing our portfolio companies and providing secure access for Limited Partners.',
    images: [
      {
        url: '/og-image.jpg', // TODO: Add this image
        width: 1200,
        height: 630,
        alt: 'The Pitch Fund',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Pitch Fund - Connecting Innovative Companies with Smart Capital',
    description: 'An investor-grade platform showcasing our portfolio companies and providing secure access for Limited Partners.',
    images: ['/og-image.jpg'], // TODO: Add this image
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0B0B0C', // pitch-black from PRD
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className={`
        ${inter.className} 
        bg-pitch-black 
        text-platinum-mist 
        antialiased 
        min-h-screen
        selection:bg-cobalt-pulse/20 
        selection:text-cobalt-pulse
      `}>
        {/* Global background with subtle texture */}
        <div className="fixed inset-0 bg-pitch-black bg-opacity-95 -z-10" />
        
        {/* Main content */}
        <main className="relative z-0">
          {children}
        </main>
        
        {/* Global scripts can go here */}
      </body>
    </html>
  )
}