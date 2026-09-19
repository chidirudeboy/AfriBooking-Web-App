import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#ffbf00',
          hover: '#eeb200',
          light: '#fff9e9',
          dark: '#ca9400',
        },
        secondary: {
          DEFAULT: '#17191b',
        },
        brand: {
          yellow: '#ffbf00',
          yellowHover: '#eeb200',
          yellowDark: '#ca9400',
          cream: '#fff9e9',
          creamDark: '#302916',
          ink: '#17191b',
          inkLight: '#f0f2f6',
          muted: '#6c7075',
          mutedDark: '#acb4c0',
          line: '#e7e8eb',
          lineDark: '#353c47',
          surface: '#ffffff',
          surfaceDark: '#1c222c',
          bgDark: '#141922',
        },
      },
    },
  },
  plugins: [],
}
export default config

