/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8ee',
          100: '#f8ecce',
          200: '#f0d699',
          300: '#e6bb5c',
          400: '#dea030',
          500: '#c98518',
          600: '#b06811',
          700: '#8d4d12',
          800: '#743e15',
          900: '#613315',
        },
        terracotta: {
          400: '#e2795a',
          500: '#c85a3b',
          600: '#a8442a',
        },
        savanna: {
          400: '#4a9d6f',
          500: '#2f7d54',
          600: '#256843',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
};
