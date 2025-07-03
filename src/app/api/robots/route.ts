import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// Use Edge runtime for better global performance
export const runtime = 'edge';
// Enable ISR with 1-hour revalidation
export const revalidate = 3600; // 1 hour

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge robots API initialized"));

// Function to get the current site URL
function getSiteUrl(): string {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://the-pitch-fund.vercel.app'; // Current Vercel deployment
}

// Function to generate robots.txt
function generateRobotsTxt(siteUrl: string): string {
  return `# *
User-agent: *
Allow: /
Allow: /api/og/
Disallow: /api/
Disallow: /api/cron/
Disallow: /admin/
Disallow: /auth/
Disallow: /lp/
Disallow: /_next/

# Host
Host: ${siteUrl}

# Sitemaps
Sitemap: ${siteUrl}/api/sitemap
`;
}

export async function GET() {
  try {
    const siteUrl = getSiteUrl();
    const robotsTxt = generateRobotsTxt(siteUrl);
    
    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    
    // Report error to Sentry
    Sentry.captureException(error);
    
    return new NextResponse('Error generating robots.txt', { status: 500 });
  }
} 