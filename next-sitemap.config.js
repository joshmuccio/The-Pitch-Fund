// Helper function to get the site URL dynamically
const getSiteUrl = () => {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: getSiteUrl(),
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [
      `${getSiteUrl()}/sitemap.xml`,
    ],
  },
  exclude: ['/api/*'], // Exclude API routes
  generateIndexSitemap: false, // Since it's a small site, we don't need index sitemap
  changefreq: 'daily',
  priority: 0.7,
  // Transform function to customize URLs
  transform: async (config, path) => {
    // Custom priority for different pages
    const priority = path === '/' ? 1.0 : path === '/portfolio' ? 0.8 : 0.7;
    
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
} 