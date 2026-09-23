/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF8F3',
          100: '#F5EFE4',
          200: '#EBDDCA',
          300: '#DEC4A6',
          400: '#CEA67E',
          500: '#B88755',
          600: '#9E6E3F',
          700: '#7E532F',
          800: '#644127',
          900: '#4D321F',
        },
        accent: {
          gold: '#E5A93C',
          amber: '#F59E0B',
          sage: '#10B981',
          sky: '#0EA5E9',
          rose: '#F43F5E',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
}
