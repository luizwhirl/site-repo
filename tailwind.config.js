/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'vsr': ['VSR', 'monospace'],
        'joystix': ['Joystix', 'monospace'],
        'share': ['"Share Tech Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}