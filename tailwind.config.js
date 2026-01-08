/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // High-contrast minimalist design palette
        primary: {
          DEFAULT: '#000000', // Pure black for active states
        },
        foreground: {
          DEFAULT: '#333333', // Dark gray for primary text
        },
        card: {
          DEFAULT: '#ffffff', // Pure white background
        },
        secondary: {
          DEFAULT: '#f0f0f0', // Light gray for inactive buttons
        },
        muted: {
          DEFAULT: '#f0f0f0', // Light gray background
          foreground: '#666666', // Medium gray for secondary text
        },
        border: {
          DEFAULT: '#dddddd', // Light gray borders
        },
        accent: {
          DEFAULT: '#007bff', // Blue accent color
        },
        destructive: {
          DEFAULT: '#dc2626', // Red for destructive actions
        },
        sidebar: {
          DEFAULT: '#1a1a1a', // Dark charcoal sidebar
          text: '#aaaaaa', // Light gray sidebar text
          active: '#2c2c2c', // Slightly lighter for active items
        },
      },
      borderRadius: {
        'base': '0.625rem',
      },
      spacing: {
        '6': '6px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
      },
      fontSize: {
        'xs': ['10px', { lineHeight: '1.5', letterSpacing: '0.05em' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.75' }],
        'lg': ['18px', { lineHeight: '1.75' }],
        'xl': ['20px', { lineHeight: '1.75' }],
        '2xl': ['24px', { lineHeight: '1.5' }],
        '3xl': ['30px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(37, 99, 235, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.8), 0 0 30px rgba(37, 99, 235, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}

