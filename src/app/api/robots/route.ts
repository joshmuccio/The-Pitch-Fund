import { NextResponse } from 'next/server';

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
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour, CDN cache for 1 day
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    return new NextResponse('Error generating robots.txt', { status: 500 });
  }
} 