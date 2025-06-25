/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      // PRD Brand System - Section 6
      colors: {
        // Primary palette
        'pitch-black': '#0B0B0C',
        'graphite-gray': '#1A1B1F', 
        'platinum-mist': '#EAEAEA',
        'cobalt-pulse': '#3E8FFF',
        'error-alert': '#FF4E1A',
        
        // Dawn gold gradient colors
        'dawn-gold': {
          light: '#F6C352',
          dark: '#B48811',
        },
        
        // Semantic color mappings
        background: {
          primary: '#0B0B0C',
          secondary: '#1A1B1F',
        },
        text: {
          primary: '#EAEAEA',
          secondary: '#EAEAEA',
          muted: '#999999',
        },
        accent: {
          primary: '#3E8FFF',
          secondary: '#F6C352',
          error: '#FF4E1A',
        }
      },
      
      // Typography - Inter font system
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Typography scale for bold headlines
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-xl': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-lg': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      
      // Letter spacing for generous tracking
      letterSpacing: {
        'generous': '0.025em',
        'extra-generous': '0.05em',
      },
      
      // Dawn gold gradient
      backgroundImage: {
        'dawn-gradient': 'linear-gradient(135deg, #F6C352 0%, #B48811 100%)',
        'dawn-gradient-hover': 'linear-gradient(135deg, #F6C352 0%, #B48811 100%)',
        'radial-dawn': 'radial-gradient(circle at center, #F6C352 0%, #B48811 70%)',
      },
      
      // Spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Animation and transitions
      transitionDuration: {
        '400': '400ms',
      },
      
      // Box shadows for depth
      boxShadow: {
        'glow': '0 0 20px rgba(62, 143, 255, 0.3)',
        'dawn-glow': '0 0 30px rgba(246, 195, 82, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      
      // Border radius for modern UI
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      
      // Custom utilities for the brand
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [
    // Custom plugin for brand utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient-dawn': {
          background: 'linear-gradient(135deg, #F6C352 0%, #B48811 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.btn-primary': {
          background: 'linear-gradient(135deg, #3E8FFF 0%, #2563EB 100%)',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 0 20px rgba(62, 143, 255, 0.3)',
          }
        },
        '.btn-secondary': {
          background: 'linear-gradient(135deg, #F6C352 0%, #B48811 100%)',
          color: '#0B0B0C',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 0 30px rgba(246, 195, 82, 0.4)',
          }
        },
        '.card-glass': {
          background: 'rgba(26, 27, 31, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(234, 234, 234, 0.1)',
          borderRadius: '1rem',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}