/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0E1116',
        paper: '#F7F7F5',
        pine: '#1F3D3B',
        ember: '#E8593A',
        neutral: {
          grey: '#8A8F98'
        }
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      maxWidth: {
        'form': '640px',
      }
    },
  },
  plugins: [],
}
