import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// Use Edge runtime for better performance
export const runtime = 'edge';
export const revalidate = 0; // Always run fresh

// Updated: Dynamic routes approach - no filesystem operations
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

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has proper authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting sitemap cache warming...');
    
    const siteUrl = getSiteUrl();
    
    // Warm up the cache by fetching the dynamic routes
    const sitemapPromise = fetch(`${siteUrl}/api/sitemap`);
    const robotsPromise = fetch(`${siteUrl}/api/robots`);
    
    // Wait for both requests to complete
    const [sitemapResponse, robotsResponse] = await Promise.all([
      sitemapPromise,
      robotsPromise
    ]);
    
    if (!sitemapResponse.ok) {
      throw new Error(`Failed to warm sitemap cache: ${sitemapResponse.status}`);
    }
    
    if (!robotsResponse.ok) {
      throw new Error(`Failed to warm robots.txt cache: ${robotsResponse.status}`);
    }
    
    console.log('Sitemap and robots.txt cache warmed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap and robots.txt cache warmed successfully',
      timestamp: new Date().toISOString(),
      siteUrl,
      cacheStatus: {
        sitemap: sitemapResponse.status,
        robots: robotsResponse.status
      }
    });
    
  } catch (error) {
    console.error('Error warming sitemap cache:', error);
    
    // Report error to Sentry
    Sentry.captureException(error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to warm sitemap cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST requests for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
} 