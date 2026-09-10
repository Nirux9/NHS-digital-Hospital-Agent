/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: '#003087',
          lightBlue: '#005eb8',
          brightBlue: '#0072ce',
          bg: '#f0fdf4',
          dark: '#131e18',
          card: '#ffffff',
          accent: '#0f9e50',
          red: '#d92d20',
          yellow: '#f79009',
          green: '#12b76a',
        },
      },
      fontFamily: {
        sans: ['Public Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
