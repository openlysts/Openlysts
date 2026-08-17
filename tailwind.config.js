/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["data-theme", "dark"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: 'hsl(var(--bg))',
        'bg-card': 'hsl(var(--bg-card))',
        'bg-subtle': 'hsl(var(--bg-subtle))',
        'bg-hover': 'hsl(var(--bg-hover))',
        text: 'hsl(var(--text))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-muted': 'hsl(var(--text-muted))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          fg: 'hsl(var(--accent-fg))',
          soft: 'hsl(var(--accent-soft))',
        },
        trending: {
          DEFAULT: 'hsl(var(--trending))',
          soft: 'hsl(var(--trending-soft))',
        },
        oss: {
          DEFAULT: 'hsl(var(--oss))',
          soft: 'hsl(var(--oss-soft))',
        },
        unknown: {
          DEFAULT: 'hsl(var(--unknown))',
          soft: 'hsl(var(--unknown-soft))',
        },
        nonoss: {
          DEFAULT: 'hsl(var(--nonoss))',
          soft: 'hsl(var(--nonoss-soft))',
        },
      },
      boxShadow: {
        'soft': 'var(--shadow)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'hover': 'var(--shadow-hover)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
}
