/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg-h) var(--bg-s) var(--bg-l) / <alpha-value>)',
        ink: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l) / <alpha-value>)',
        'ink-soft': 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l) / <alpha-value>)',
        rule: 'hsl(var(--rule-h) var(--rule-s) var(--rule-l) / <alpha-value>)',
        accent: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'type-xs': 'var(--type-xs)',
        'type-sm': 'var(--type-sm)',
        'type-base': 'var(--type-base)',
        'type-md': 'var(--type-md)',
        'type-lg': 'var(--type-lg)',
        'type-xl': 'var(--type-xl)',
        'type-2xl': 'var(--type-2xl)',
        'type-3xl': 'var(--type-3xl)',
      },
      spacing: {
        'space-1': 'var(--space-1)', 'space-2': 'var(--space-2)', 'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)', 'space-6': 'var(--space-6)', 'space-8': 'var(--space-8)',
        'space-12': 'var(--space-12)', 'space-16': 'var(--space-16)', 'space-24': 'var(--space-24)',
        'space-32': 'var(--space-32)', 'space-48': 'var(--space-48)',
      },
      backdropBlur: { glass: 'var(--glass-blur)', 'glass-deep': 'var(--glass-blur-deep)' },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast: '200ms', base: '400ms', slow: '800ms',
      },
    },
  },
  plugins: [],
}
