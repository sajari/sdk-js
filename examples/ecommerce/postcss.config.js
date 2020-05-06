/* eslint-disable global-require, import/no-extraneous-dependencies */

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-clean')({
      level: 2, // Merge duplicated declarations
    }),
  ],
};
