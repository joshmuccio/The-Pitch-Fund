import Link from 'next/link';
import { jetbrainsMono } from '../app/fonts';   // our import from Step 1

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`
        ${jetbrainsMono.className} mono-tag          /* JetBrains Mono, caps, spacing   */
        px-3 py-1.5                                  /* 12 × 6 px padding              */
        text-sm text-primary/50                      /* 50 % tint at rest              */
        hover:text-primary focus:text-primary        /* full tint on hover/focus       */
        visited:text-primary/50                      /* keeps visited links tame       */
        transition-colors
      `}
    >
      {children}
    </Link>
  );
} 