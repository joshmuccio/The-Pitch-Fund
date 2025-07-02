import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// Use Edge runtime for better performance
export const runtime = 'edge';
export const revalidate = 0; // Always run fresh

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

    console.log('🔄 ISR Cache Refresh: Triggering sitemap and robots.txt regeneration...');
    
    const siteUrl = getSiteUrl();
    
    // Trigger ISR cache refresh by making requests with cache-busting
    const timestamp = Date.now();
    const sitemapPromise = fetch(`${siteUrl}/api/sitemap?refresh=${timestamp}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const robotsPromise = fetch(`${siteUrl}/api/robots?refresh=${timestamp}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    // Wait for both requests to complete
    const [sitemapResponse, robotsResponse] = await Promise.all([
      sitemapPromise,
      robotsPromise
    ]);
    
    if (!sitemapResponse.ok) {
      throw new Error(`Failed to refresh sitemap ISR cache: ${sitemapResponse.status}`);
    }
    
    if (!robotsResponse.ok) {
      throw new Error(`Failed to refresh robots.txt ISR cache: ${robotsResponse.status}`);
    }
    
    console.log('✅ ISR cache refreshed successfully for sitemap and robots.txt');
    
    return NextResponse.json({
      success: true,
      message: 'ISR cache refreshed successfully for sitemap and robots.txt',
      note: 'Static files are generated during build, ISR handles dynamic caching',
      timestamp: new Date().toISOString(),
      siteUrl,
      cacheStatus: {
        sitemap: sitemapResponse.status,
        robots: robotsResponse.status
      },
      isrEnabled: true
    });
    
  } catch (error) {
    console.error('Error refreshing ISR cache:', error);
    
    // Report error to Sentry
    Sentry.captureException(error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh ISR cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST requests for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
} 