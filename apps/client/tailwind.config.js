/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'brikx-dark': '#0A2540',
        'brikx-dark-light': '#0A3552',
        'brikx-teal': '#2D9CDB',
        'brikx-teal-dark': '#1D7AAC',
        'brikx-teal-light': '#56B4E9',
        'brikx-border': '#1D3A5C',
        'brikx-bg': '#F5F7FA',
        'brikx-success': '#27AE60',
        'brikx-warning': '#F2C94C',
        'brikx-premium': '#FFB946',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { 
        'brikx': '12px' 
      },
      boxShadow: {
        'brikx': '0 4px 12px rgba(45, 156, 219, 0.3)',
        'brikx-lg': '0 8px 24px rgba(45, 156, 219, 0.4)',
      },
    },
  },
  plugins: [],
}