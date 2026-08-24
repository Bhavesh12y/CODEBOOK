/** @type {import('tailwindcss').Config} */
export default {
  content: ['./frontend/index.html', './frontend/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        work: {
          950: '#0b0d10',
          900: '#111418',
          850: '#171b20',
          800: '#1d2228',
          700: '#2b323a',
          500: '#56616e',
        },
        signal: {
          green: '#4ade80',
          amber: '#fbbf24',
          red: '#fb7185',
          blue: '#38bdf8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Cascadia Code', 'SFMono-Regular', 'Consolas', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        focus: '0 0 0 1px rgba(56, 189, 248, 0.48)',
      },
    },
  },
  plugins: [],
};
