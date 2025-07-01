import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import * as Sentry from '@sentry/nextjs';

// Use Node.js runtime for file system access
export const runtime = 'nodejs';
export const revalidate = 0; // Always run fresh

// Initialize Sentry for Node.js runtime
Sentry.captureException(new Error("Cron sitemap API initialized"));

// Function to get the current site URL
function getSiteUrl(): string {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://thepitch.fund'; // Production fallback
}

// Function to generate sitemap XML
function generateSitemapXML(siteUrl: string): string {
  const now = new Date().toISOString();
  
  // Only include user-facing pages, exclude API routes, admin, auth, and cron endpoints
  const urls = [
    {
      loc: '/',
      lastmod: now,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: '/portfolio',
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8'
    }
  ];

  const urlElements = urls.map(url => `
  <url>
    <loc>${siteUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
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
Sitemap: ${siteUrl}/sitemap.xml
`;
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

    console.log('Starting sitemap regeneration...');
    
    const siteUrl = getSiteUrl();
    const publicDir = path.join(process.cwd(), 'public');
    
    // Generate new sitemap
    const sitemapXML = generateSitemapXML(siteUrl);
    const robotsTxt = generateRobotsTxt(siteUrl);
    
    // Write sitemap.xml
    await writeFile(
      path.join(publicDir, 'sitemap.xml'),
      sitemapXML,
      'utf8'
    );
    
    // Write robots.txt
    await writeFile(
      path.join(publicDir, 'robots.txt'),
      robotsTxt,
      'utf8'
    );
    
    console.log('Sitemap and robots.txt regenerated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap and robots.txt regenerated successfully',
      timestamp: new Date().toISOString(),
      siteUrl
    });
    
  } catch (error) {
    console.error('Error regenerating sitemap:', error);
    
    // Report error to Sentry
    Sentry.captureException(error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to regenerate sitemap',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST requests for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
} 