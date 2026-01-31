import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
    './entrypoints/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn-like dark theme (zinc-based)
        background: '#09090B',
        'background-secondary': '#18181B',
        card: '#27272A',
        'card-elevated': '#3F3F46',
        border: '#27272A',
        'border-subtle': '#1F1F23',
        foreground: '#FAFAFA',
        'foreground-secondary': '#A1A1AA',
        'foreground-muted': '#71717A',
        accent: '#FAFAFA',
        'accent-hover': '#E4E4E7',
        // Keep some semantic colors (muted for shadcn style)
        success: {
          DEFAULT: '#A1A1AA',
          bg: '#18181B',
        },
        warning: {
          DEFAULT: '#A1A1AA',
          bg: '#18181B',
        },
        danger: {
          DEFAULT: '#A1A1AA',
          bg: '#18181B',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
