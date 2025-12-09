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
      colors: {
        primary: {
          DEFAULT: '#E09702',
          light: '#FBC808',
          dark: '#DE9301',
        },
        secondary: {
          DEFAULT: '#414046',
        },
      },
    },
  },
  plugins: [],
}
export default config

