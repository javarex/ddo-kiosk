module.exports = {
  content: [
    "./src/**/*.{html,js}", // adjust to your Electron renderer paths
    "./index.html",
  ],
  safelist: [
    'transition',
    'duration-300',
    'ease-out',
    'ease-in',
    'opacity-0',
    'opacity-100',
    'scale-90',
    'scale-100',
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
    },
  },
  plugins: [],
};
