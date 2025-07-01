'use client';

import { track } from '@vercel/analytics';
import { useCallback } from 'react';

export default function CTAButton() {
  const handleClick = useCallback(() => {
    // Track CTA click with context
    track('cta_click', { location: 'hero' });
  }, []);

  return (
    <a
      href="#subscribe"
      onClick={handleClick}
      className="inline-block rounded-full bg-cobalt-pulse px-10 py-4 text-lg font-semibold text-pitch-black shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      Get Fund Updates
    </a>
  );
} 