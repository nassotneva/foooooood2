/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./client/index.html",
  ],
  theme: {
    extend: {
      borderColor: {
        border: 'hsl(var(--border))',
      },
    },
  },
  plugins: [],
}

