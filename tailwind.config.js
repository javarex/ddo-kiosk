module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./index.html",
  ],
  safelist: [
    'transition',
    'duration-300',
    'duration-200',
    'ease-out',
    'ease-in',
    'opacity-0',
    'opacity-100',
    'scale-90',
    'scale-100',
    'translate-y-0',
    'translate-y-4',
    'delay-100',
  ],

  theme: {
    extend: {
      colors: {
        'regal-blue': '#243c5a',
        'highlight_gold': {
          1: 'rgb(252, 236, 101)',
          2: '#fcf7e1'
        },
        'gold': 'rgb(229, 184, 7)',
        'sepia_brown': {
          1: 'rgb(68, 43, 2)',
          2: '#4d3102',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
