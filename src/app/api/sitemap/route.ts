import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to prevent caching for testing
export const dynamic = 'force-dynamic';

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

export async function GET() {
  try {
    const siteUrl = getSiteUrl();
    const sitemapXML = generateSitemapXML(siteUrl);
    
    return new NextResponse(sitemapXML, {
      headers: {
        'Content-Type': 'application/xml',
        // No cache-control headers - let force-dynamic handle caching
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
} 