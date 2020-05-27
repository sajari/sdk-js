/* eslint-disable global-require */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  purge: {
    // enabled: true,
    content: ['./src/**/*.{js,html}'],
  },
  theme: {
    fontFamily: {
      ...defaultTheme.fontFamily,
      sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      mono: ['SFMono-Regular', ...defaultTheme.fontFamily.mono],
    },
    extend: {
      spacing: {
        '(screen-20)': 'calc(100vh - 5rem)',
      },
      padding: {
        full: '100%',
      },
    },
    linearGradientColors: (theme) => theme('colors'),
    truncate: {
      lines: {
        2: '2',
        3: '3',
      },
    },
  },
  variants: {
    zIndex: ['responsive', 'hover', 'focus'],
    boxShadow: ['responsive', 'hover', 'focus', 'focus-within'],
  },
  plugins: [require('@tailwindcss/ui'), require('tailwindcss-gradients'), require('tailwindcss-truncate-multiline')()],
};
