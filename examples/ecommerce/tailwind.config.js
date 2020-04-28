/* eslint-disable global-require */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    fontFamily: {
      sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      mono: ['SFMono-Regular', ...defaultTheme.fontFamily.mono],
    },
    extend: {
      spacing: {
        '(screen-20)': 'calc(100vh - 5rem)',
      },
    },
    linearGradientColors: (theme) => theme('colors'),
  },
  variants: {
    zIndex: ['responsive', 'hover', 'focus'],
    boxShadow: ['responsive', 'hover', 'focus', 'focus-within'],
  },
  plugins: [require('@tailwindcss/ui'), require('tailwindcss-gradients')],
};
