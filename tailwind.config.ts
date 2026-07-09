import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0C4076',
        'primary-dark': '#082d56',
        secondary: '#C6363C',
        'secondary-dark': '#9f242a',
      },
    },
  },
  plugins: [],
}
export default config
