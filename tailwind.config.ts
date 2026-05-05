import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'col-span-1', 'lg:col-span-4', 'lg:col-span-6', 'lg:col-span-8', 'lg:col-span-12',
    'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'md:grid-cols-4', 'lg:grid-cols-5',
  ],
  theme: {
    extend: {
      colors: {
        bank: {
          primary: 'rgb(var(--theme-primary-rgb, 26 58 107) / <alpha-value>)',
          secondary: 'rgb(var(--theme-secondary-rgb, 197 160 40) / <alpha-value>)',
          dark: 'rgb(var(--theme-dark-rgb, 13 31 60) / <alpha-value>)',
          light: '#f5f6fa',
          accent: 'rgb(var(--theme-accent-rgb, 37 99 235) / <alpha-value>)',
          gold: 'rgb(var(--theme-gold-rgb, 212 165 48) / <alpha-value>)',
          gray: '#6b7280',
          red: 'rgb(var(--theme-red-rgb, 196 22 28) / <alpha-value>)',
          redDark: 'rgb(var(--theme-red-dark-rgb, 160 18 24) / <alpha-value>)',
          orange: '#e8811a',
          sectionBg: 'rgb(var(--theme-section-bg-rgb, 58 58 58) / <alpha-value>)',
          headerBg: 'rgb(var(--theme-header-bg-rgb, 44 44 44) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', 'sans-serif'],
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
