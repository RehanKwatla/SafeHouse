/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        base: {
          DEFAULT: '#080A0C',
          surface: '#101419',
          elevated: '#151B20',
          hover: '#1A2128',
        },
        // Borders
        line: {
          DEFAULT: '#252C32',
          strong: '#333C44',
          faint: '#1B2228',
        },
        // Primary safety green
        green: {
          DEFAULT: '#B8F34A',
          dim: '#8FBE32',
          glow: 'rgba(184, 243, 74, 0.25)',
          tint: 'rgba(184, 243, 74, 0.08)',
        },
        // Warning amber
        amber: {
          DEFAULT: '#F5B942',
          dim: '#C89330',
          glow: 'rgba(245, 185, 66, 0.22)',
          tint: 'rgba(245, 185, 66, 0.08)',
        },
        // Critical red
        red: {
          DEFAULT: '#FF4D4D',
          dim: '#CC3D3D',
          glow: 'rgba(255, 77, 77, 0.22)',
          tint: 'rgba(255, 77, 77, 0.08)',
        },
        // Text
        ink: {
          DEFAULT: '#E8ECEF',
          muted: '#7D8790',
          faint: '#4A5258',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      animation: {
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 1.5s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scan-line': 'scan-line 4s linear infinite',
        'robot-glow': 'robot-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(184, 243, 74, 0.4)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 0 6px rgba(184, 243, 74, 0)' },
        },
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-amber': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        'robot-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(184, 243, 74, 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 10px rgba(184, 243, 74, 0.8))' },
        },
      },
    },
  },
  plugins: [],
};
