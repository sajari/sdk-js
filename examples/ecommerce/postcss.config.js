/* eslint-disable global-require, import/no-extraneous-dependencies */

const purgecss = require('@fullhuman/postcss-purgecss')({
  // Specify the paths to all of the template files in your project
  content: ['./src/**/*.js', './src/**/*.html'],

  // Include any special characters you're using in this regular expression
  defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:/?()]+/g) || [],
});

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-clean')({
      level: 2, // Merge duplicated styles etc
    }),
    ...(process.env.NODE_ENV === 'production' ? [purgecss] : []),
  ],
};
