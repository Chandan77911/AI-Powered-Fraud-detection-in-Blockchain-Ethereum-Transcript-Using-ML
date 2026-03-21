/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eth: {
          // Base surfaces — deep midnight banking feel
          bg:        '#080810',
          surface:   '#0e0e1a',
          card:      '#13131f',
          card2:     '#181826',
          border:    '#252538',
          border2:   '#2e2e48',
          // Ethereum brand purples
          purple:    '#627EEA',   // Ethereum primary
          purple2:   '#8B9FEF',   // lighter
          purple3:   '#3C3C7D',   // deep
          purpleDim: '#627eea22',
          // Accent colors
          cyan:      '#4FC3F7',   // electric cyan — transaction flows
          coral:     '#FF6B6B',   // vibrant coral — high risk
          coral2:    '#FF8E53',   // orange-coral — medium risk
          gold:      '#FFD166',   // gold — warning
          green:     '#06D6A0',   // emerald green — safe
          // Text
          text:      '#CBD5E1',
          textDim:   '#64748B',
          textBright:'#F1F5F9',
          // Glow helpers
          glowPurple:'rgba(98,126,234,0.35)',
          glowCyan:  'rgba(79,195,247,0.35)',
          glowCoral: 'rgba(255,107,107,0.35)',
          glowGreen: 'rgba(6,214,160,0.35)',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        heading: ['"Syne"', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 24px rgba(98,126,234,0.4), 0 0 60px rgba(98,126,234,0.15)',
        'glow-cyan':   '0 0 24px rgba(79,195,247,0.4), 0 0 60px rgba(79,195,247,0.15)',
        'glow-coral':  '0 0 24px rgba(255,107,107,0.45), 0 0 60px rgba(255,107,107,0.18)',
        'glow-green':  '0 0 24px rgba(6,214,160,0.4), 0 0 60px rgba(6,214,160,0.15)',
        'glow-gold':   '0 0 24px rgba(255,209,102,0.4), 0 0 60px rgba(255,209,102,0.15)',
        'card':        'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.5)',
        'card-hover':  'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 50px rgba(0,0,0,0.6)',
        'panel':       '0 0 0 1px rgba(98,126,234,0.15), 0 8px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'orbit':       'orbit 8s linear infinite',
        'orbit-rev':   'orbitRev 12s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'glow-breathe':'glowBreathe 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.5s ease-out forwards',
        'shimmer':     'shimmer 2.5s linear infinite',
      },
      keyframes: {
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' },
        },
        orbitRev: {
          '0%':   { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg) translateX(120px) rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glowBreathe: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.04)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}
