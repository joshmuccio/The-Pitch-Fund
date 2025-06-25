'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-pitch-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="text-xl font-bold text-gradient-gold">The Pitch Fund</a>

        {/* Desktop links */}
        <nav className="hidden md:flex gap-8 text-sm">
          {['Portfolio','About','Contact'].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} className="hover:text-cobalt-pulse transition-colors">
              {link}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-platinum-mist hover:text-cobalt-pulse"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden flex flex-col gap-6 bg-pitch-black px-6 pb-8 pt-4 text-lg">
          {['Portfolio','About','Contact'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="hover:text-cobalt-pulse transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
} 