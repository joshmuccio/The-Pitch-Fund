'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';

export default function PortfolioLink() {
  const handleClick = () => {
    track('portfolio_view_click', { location: 'homepage_portfolio_section' });
  };

  return (
    <Link 
      href="/portfolio" 
      className="inline-block text-cobalt-pulse hover:underline"
      onClick={handleClick}
    >
      View full portfolio →
    </Link>
  );
} 