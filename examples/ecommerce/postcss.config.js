/* eslint-disable global-require, import/no-extraneous-dependencies */
const { tailwindConfig } = require('@sajari-ui/core');

// Setup purging of CSS
tailwindConfig.purge.content.push('./**/*.{js,html}');

// Add full padding option for images
tailwindConfig.theme.extend.padding = {
  full: '100%',
};

module.exports = {
  plugins: [['tailwindcss', tailwindConfig], 'autoprefixer', ['postcss-clean', { level: 2 }]],
};
