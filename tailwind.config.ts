import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff9db',
          100: '#ffe88f',
          400: '#f4cc45',
          500: '#eab308',
          900: '#2f2a1f',
        },
      },
      boxShadow: {
        card: '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
