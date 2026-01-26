import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DegenArena brand colors from the logo
        arena: {
          purple: '#9945FF',
          pink: '#F472B6',
          cyan: '#14F195',
          blue: '#4F46E5',
          dark: '#0D0D0D',
          darker: '#080808',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-arena': 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
        'gradient-card': 'linear-gradient(180deg, rgba(153, 69, 255, 0.1) 0%, rgba(20, 241, 149, 0.05) 100%)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(153, 69, 255, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(20, 241, 149, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
