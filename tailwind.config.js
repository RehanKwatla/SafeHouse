/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mission control backgrounds — dark blueprint / near-black cyan
        base: {
          DEFAULT: '#030607',
          surface: '#070E10',
          elevated: '#0C1719',
          hover: '#101F22',
        },
        // Borders — thin technical cyan-slate
        line: {
          DEFAULT: '#142A2E',
          strong: '#1F4046',
          faint: '#0B1A1C',
          accent: '#29575F',
        },
        // Primary SafeRoom neon green
        green: {
          DEFAULT: '#9CFF32',
          dim: '#70BD22',
          bright: '#B5FF5E',
          glow: 'rgba(156, 255, 50, 0.25)',
          tint: 'rgba(156, 255, 50, 0.08)',
        },
        // Technical cyan — navigation, coordinates, sensors
        cyan: {
          DEFAULT: '#35D9E8',
          dim: '#269EAA',
          bright: '#5FF0FD',
          tint: 'rgba(53, 217, 232, 0.08)',
          glow: 'rgba(53, 217, 232, 0.25)',
        },
        // Warning amber
        amber: {
          DEFAULT: '#F2B84B',
          dim: '#B5872E',
          glow: 'rgba(242, 184, 75, 0.25)',
          tint: 'rgba(242, 184, 75, 0.08)',
        },
        // Critical red
        red: {
          DEFAULT: '#FF3B30',
          dim: '#C4271E',
          glow: 'rgba(255, 59, 48, 0.25)',
          tint: 'rgba(255, 59, 48, 0.08)',
        },
        // Text hierarchy
        ink: {
          DEFAULT: '#DDE8E8',
          muted: '#718385',
          faint: '#3E5254',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        '3xs': ['0.5625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 1.5s ease-in-out infinite',
        'slide-in': 'slide-in 0.25s ease-out',
        'fade-in': 'fade-in 0.25s ease-out',
        'heartbeat': 'heartbeat 1.4s ease-in-out infinite',
        'telemetry-flow': 'telemetry-flow 8s linear infinite',
        'waveform': 'waveform 0.8s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'pulse-amber': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'heartbeat': {
          '0%':   { transform: 'scaleY(1)' },
          '10%':  { transform: 'scaleY(2.2)' },
          '20%':  { transform: 'scaleY(0.8)' },
          '30%':  { transform: 'scaleY(1.6)' },
          '40%':  { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(1)' },
        },
        'telemetry-flow': {
          '0%':   { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        'waveform': {
          from: { transform: 'scaleY(0.3)' },
          to:   { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
