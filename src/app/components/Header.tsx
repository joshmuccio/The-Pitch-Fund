'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { track } from '@vercel/analytics';
import { bebas } from '../fonts';
import { NavLink } from '../../components/NavLink';

export default function Header() {
  const [open, setOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    const newOpenState = !open;
    setOpen(newOpenState);
    
    // Track mobile menu usage
    track('mobile_menu_toggle', { 
      action: newOpenState ? 'open' : 'close',
      location: 'header' 
    });
  };

  const handleLogoClick = () => {
    // Track logo clicks
    track('logo_click', { location: 'header' });
  };

  const handleMobileNavClick = (href: string, label: string) => {
    setOpen(false);
    // Track mobile navigation clicks
    track('mobile_navigation_click', { 
      destination: href,
      link_text: label 
    });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-pitch-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2" onClick={handleLogoClick}>
          <Image
            src="/images/The_Pitch_Fund_logo_white_transparent_384x50.png"
            alt="The Pitch Fund"
            width={138}   // 384 ÷ 50 × 18   → 138 px
            height={18}
            className="inline-block select-none align-middle"
            priority
          />
          <span className="sr-only">The Pitch Fund</span>
        </a>

        {/* Desktop links */}
        <nav className="hidden md:flex gap-8 text-sm">
          {[
            { href: '#portfolio', label: 'Portfolio' },
            { href: '#about', label: 'About' },
            { href: '#contact', label: 'Contact' },
          ].map(({ href, label }) => (
            <NavLink key={href} href={href}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={handleMobileMenuToggle}
          className="md:hidden text-platinum-mist hover:text-cobalt-pulse"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden flex flex-col gap-6 bg-pitch-black px-6 pb-8 pt-4 text-lg">
          {[
            { href: '#portfolio', label: 'Portfolio' },
            { href: '#about', label: 'About' },
            { href: '#contact', label: 'Contact' },
          ].map(({ href, label }) => (
            <div key={href} onClick={() => handleMobileNavClick(href, label)}>
              <NavLink href={href}>
                {label}
              </NavLink>
            </div>
          ))}
        </nav>
      )}
    </header>
  );
} 