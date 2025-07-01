import type { Metadata } from 'next';

interface PageMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  path?: string;
  noIndex?: boolean;
}

const SITE_CONFIG = {
  name: 'The Pitch Fund',
  url: 'https://thepitch.fund',
  description: 'Backing world-class startups you hear on The Pitch podcast. Venture capital fund with proven track record.',
  defaultOgTitle: 'Investing in world-class startups you hear on The Pitch',
};

export function generatePageMetadata({
  title = 'Investing in World-Class Startups from The Pitch',
  description = SITE_CONFIG.description,
  ogTitle,
  ogDescription,
  path = '',
  noIndex = false,
}: PageMetadata = {}): Metadata {
  const fullTitle = title.includes(SITE_CONFIG.name) ? title : `${title} | ${SITE_CONFIG.name}`;
  const canonicalUrl = `${SITE_CONFIG.url}${path}`;
  const finalOgTitle = ogTitle || title.replace(` | ${SITE_CONFIG.name}`, '');
  const finalOgDescription = ogDescription || description;

  return {
    title: fullTitle,
    description,
    keywords: ['venture capital', 'startup funding', 'The Pitch podcast', 'angel investing', 'startup investment fund', 'early stage investing'],
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: finalOgTitle,
      description: finalOgDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `${SITE_CONFIG.url}/api/og?title=${encodeURIComponent(finalOgTitle)}`,
          width: 1200,
          height: 630,
          alt: finalOgTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalOgTitle,
      description: finalOgDescription,
      creator: '@thepitchshow',
      images: [`${SITE_CONFIG.url}/api/og?title=${encodeURIComponent(finalOgTitle)}`],
    },
    robots: noIndex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: [{ rel: 'icon', url: '/favicon.ico' }],
  };
}

// Specific preset functions for common pages
export const homeMetadata = () => generatePageMetadata({
  title: 'The Pitch Fund | Investing in World-Class Startups from The Pitch',
  ogTitle: 'Investing in world-class startups you hear on The Pitch',
});

export const portfolioMetadata = () => generatePageMetadata({
  title: 'Portfolio',
  description: 'Explore our portfolio of world-class startups backed by The Pitch Fund. Meet the founders we\'ve invested in from The Pitch podcast.',
  ogTitle: 'Portfolio | World-class startups from The Pitch',
  path: '/portfolio',
});

export const adminMetadata = () => generatePageMetadata({
  title: 'Admin Dashboard',
  description: 'Admin dashboard for managing portfolio companies and founders',
  path: '/admin',
  noIndex: true,
});

export const loginMetadata = () => generatePageMetadata({
  title: 'Sign In',
  description: 'Sign in to your Limited Partner portal',
  path: '/auth/login',
  noIndex: true,
});

export const lpDashboardMetadata = () => generatePageMetadata({
  title: 'LP Dashboard',
  description: 'Limited Partner dashboard for portfolio insights',
  path: '/lp/dashboard',
  noIndex: true,
}); 