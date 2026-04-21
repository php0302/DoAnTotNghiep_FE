/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0075de',
          hover:   '#005bab',
          focus:   '#097fe8',
          light:   '#f2f9ff',
        },
        warm: {
          white: '#f6f5f4',
          dark:  '#31302e',
          gray:  '#615d59',
          muted: '#a39e98',
        },
        teal:    '#2a9d99',
        danger:  '#dd5b00',
        success: '#1aae39',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': 'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.84688px, rgba(0,0,0,0.02) 0px 0.8px 2.925px, rgba(0,0,0,0.01) 0px 0.175px 1.04062px',
        'deep': 'rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px',
        'focus': '0 0 0 3px rgba(9,127,232,0.2)',
      },
      borderRadius: {
        'pill': '9999px',
      },
    },
  },
  plugins: [],
}
