/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      /* ── Spacing: 8pt grid ── */
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },

      /* ── Border Radius ── */
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },

      /* ── Color Tokens ── */
      colors: {
        /* Brand */
        brand: {
          DEFAULT: '#0F3D2E',
          light: '#1a5c44',
          muted: '#0F3D2E0F',
        },
        gold: {
          DEFAULT: '#C8A951',
          dark: '#D4AF37',
        },
        teal: {
          DEFAULT: '#2EB6A0',
        },
        coral: {
          DEFAULT: '#E76F51',
        },

        /* Text */
        ink: {
          DEFAULT: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#AEAEB2',
          faint: '#D1D1D6',
        },

        /* Surfaces */
        surface: {
          DEFAULT: '#FBFBFD',
          card: '#FFFFFF',
          subtle: '#F5F5F7',
          muted: '#EDEDF0',
          warm: '#F7F5EF',
        },

        /* Semantic */
        success: { DEFAULT: '#34C759' },
        warning: { DEFAULT: '#FF9F0A' },
        danger:  { DEFAULT: '#FF3B30' },
        info:    { DEFAULT: '#007AFF' },

        /* Shadcn compatibility */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },

      /* ── Font Family ── */
      fontFamily: {
        quran: ["'KFGQPC Uthmanic Script HAFS'", "'Amiri'", 'serif'],
      },

      /* ── Typography ── */
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '600' }],
        'h1':      ['2rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '600' }],
        'h2':      ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h3':      ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body':    ['0.9375rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '400' }],
        'small':   ['0.8125rem', { lineHeight: '1.4', letterSpacing: '-0.005em', fontWeight: '500' }],
        'caption':  ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '500' }],
      },

      /* ── Shadows ── */
      boxShadow: {
        'apple-xs': '0 1px 2px rgba(0,0,0,0.04)',
        'apple-sm': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'apple-md': '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        'apple-lg': '0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.08)',
      },

      /* ── Animations ── */
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'drawer-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'fade-in':          'fade-in 0.3s ease-out',
        'fade-in-up':       'fade-in-up 0.4s ease-out',
        'slide-in-right':   'slide-in-right 0.3s ease-out',
        'drawer-in-right':  'drawer-in-right 0.3s cubic-bezier(0.32,0.72,0,1)',
        'scale-in':         'scale-in 0.2s ease-out',
        'modal-in':         'modal-in 0.25s cubic-bezier(0.32,0.72,0,1)',
        'shimmer':          'shimmer 1.5s ease-in-out infinite',
        'accordion-down':   'accordion-down 0.2s ease-out',
        'accordion-up':     'accordion-up 0.2s ease-out',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};
