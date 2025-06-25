import { Bebas_Neue, JetBrains_Mono } from 'next/font/google';

export const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',   // <-- we'll map this to Tailwind's `font-mono`
  display: 'swap',
});