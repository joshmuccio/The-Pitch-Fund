/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'pitch-black': '#0B0B0C',
        'graphite-gray': '#1A1B1F',
        'platinum-mist': '#EAEAEA',
        'cobalt-pulse': '#3E8FFF',
        'dawn-gold-start': '#F6C352',
        'dawn-gold-end': '#B48811',
        'error-alert': '#FF4E1A',
        primary: 'hsl(0 0% 100%)',   // = white in dark-theme; adjust if you're using a design-token system
      },
      backgroundImage: {
        'dawn-gold-radial': 'radial-gradient(circle at 30% 30%, #F6C352, #B48811 60%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      typography: ({ theme }) => ({
        invert: {
          css: {
            '--tw-prose-bullets': theme('colors.cobalt-pulse'),
            a: { color: theme('colors.cobalt-pulse') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
