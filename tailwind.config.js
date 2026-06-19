/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        academic: {
          dark: "#0f172a",
          blue: "#1e40af",
          light: "#99f6e4",
          emerald: "#10b981",
          teal: "#2dd4bf",
        }
      }
    },
  },
  plugins: [],
}

