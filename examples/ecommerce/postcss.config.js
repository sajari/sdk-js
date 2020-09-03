/* eslint-disable global-require, import/no-extraneous-dependencies */
const { tailwindConfig } = require('@sajari-ui/core');

// Setup purging of CSS
tailwindConfig.purge.content.push('./src/**/*.{js,html}');

// Setup gradients
tailwindConfig.theme.linearGradientColors = (theme) => theme('colors');
tailwindConfig.plugins.push(require('tailwindcss-gradients'));

// Add full padding option for images
tailwindConfig.theme.extend.padding = {
  full: '100%',
};

module.exports = {
  plugins: [
    require('tailwindcss')(tailwindConfig),
    require('autoprefixer'),
    require('postcss-clean')({
      level: 2, // Merge duplicated declarations
    }),
  ],
};
