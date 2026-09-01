/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mission control backgrounds — deep graphite
        base: {
          DEFAULT: '#06090B',
          surface: '#0B1114',
          elevated: '#10171A',
          hover: '#142024',
        },
        // Borders — technical, not decorative
        line: {
          DEFAULT: '#1C292D',
          strong: '#263540',
          faint: '#111C20',
          accent: '#2A3F45',
        },
        // Primary safety green
        green: {
          DEFAULT: '#A8F04D',
          dim: '#7BB836',
          bright: '#C2FF6A',
          glow: 'rgba(168, 240, 77, 0.2)',
          tint: 'rgba(168, 240, 77, 0.07)',
        },
        // Technical cyan — navigation, coordinates, data
        cyan: {
          DEFAULT: '#55D6E8',
          dim: '#3BA8B8',
          tint: 'rgba(85, 214, 232, 0.07)',
        },
        // Warning amber
        amber: {
          DEFAULT: '#F2B84B',
          dim: '#C4922E',
          glow: 'rgba(242, 184, 75, 0.2)',
          tint: 'rgba(242, 184, 75, 0.07)',
        },
        // Critical red
        red: {
          DEFAULT: '#FF4D4D',
          dim: '#CC3D3D',
          glow: 'rgba(255, 77, 77, 0.2)',
          tint: 'rgba(255, 77, 77, 0.07)',
        },
        // Text hierarchy
        ink: {
          DEFAULT: '#E6ECEE',
          muted: '#758287',
          faint: '#3D4F55',
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
