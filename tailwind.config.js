/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["data-theme", "dark"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Mona Sans"', 'system-ui', 'sans-serif'],
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
      keyframes: {
        'logo-enter': {
          '0%': { 
            opacity: 0, 
            transform: 'perspective(600px) rotateY(-180deg) rotateX(20deg) scale(0.3) translateY(-30px)' 
          },
          '60%': { 
            opacity: 1, 
            transform: 'perspective(600px) rotateY(20deg) rotateX(-5deg) scale(1.1) translateY(5px)' 
          },
          '80%': { 
            transform: 'perspective(600px) rotateY(-5deg) rotateX(2deg) scale(0.95) translateY(-2px)' 
          },
          '100%': { 
            opacity: 1, 
            transform: 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1) translateY(0)' 
          },
        }
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'logo-enter': 'logo-enter 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
}
