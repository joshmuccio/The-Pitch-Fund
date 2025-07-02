#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://the-pitch-fund.vercel.app';
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Function to get the current site URL
function getSiteUrl() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://the-pitch-fund.vercel.app';
}

// Function to generate sitemap XML (duplicated from API route for build time)
function generateSitemapXML(siteUrl) {
  const now = new Date().toISOString();
  
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

// Function to generate robots.txt (duplicated from API route for build time)
function generateRobotsTxt(siteUrl) {
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

async function generateStaticFiles() {
  console.log('🚀 Generating static SEO files...');
  
  try {
    const siteUrl = getSiteUrl();
    console.log(`📍 Site URL: ${siteUrl}`);
    
    // Generate sitemap.xml
    const sitemapXML = generateSitemapXML(siteUrl);
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
    console.log(`✅ Generated: ${sitemapPath}`);
    
    // Generate robots.txt  
    const robotsTxt = generateRobotsTxt(siteUrl);
    const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
    console.log(`✅ Generated: ${robotsPath}`);
    
    console.log('🎉 Static SEO files generated successfully!');
    console.log(`📄 Sitemap: ${siteUrl}/sitemap.xml`);
    console.log(`🤖 Robots: ${siteUrl}/robots.txt`);
    console.log(`📡 Dynamic API: ${siteUrl}/api/sitemap (ISR enabled)`);
    
  } catch (error) {
    console.error('❌ Error generating static SEO files:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateStaticFiles();
}

module.exports = { generateStaticFiles }; 