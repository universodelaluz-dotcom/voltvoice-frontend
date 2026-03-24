/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'voltvoice-cyan': '#06b6d4',
        'voltvoice-purple': '#a855f7',
        'voltvoice-yellow': '#eab308',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
      },
    },
  },
  plugins: [],
}
