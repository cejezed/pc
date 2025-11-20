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
        zeus: {
          bg: 'var(--zeus-bg)',
          card: 'var(--zeus-card)',
          'card-hover': 'var(--zeus-card-hover)',
          accent: 'var(--zeus-accent)',
          'accent-glow': 'var(--zeus-accent-glow)',
          text: 'var(--zeus-text)',
          'text-secondary': 'var(--zeus-text-secondary)',
          'text-highlight': 'var(--zeus-text-highlight)',
          border: 'var(--zeus-border)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'brikx': '12px',
        'brikx-lg': '16px',
        'brikx-xl': '20px',
        'brikx-2xl': '24px',
      },
      boxShadow: {
        'brikx': '0 4px 12px rgba(45, 156, 219, 0.3)',
        'brikx-lg': '0 8px 24px rgba(45, 156, 219, 0.4)',
        'brikx-xl': '0 20px 25px -5px rgba(45, 156, 219, 0.15)',
        'modern': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modern-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'modern-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner-modern': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        'brikx': '8px',
      },
    },
  },
  plugins: [],
}