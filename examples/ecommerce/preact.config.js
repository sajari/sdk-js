/* eslint-disable import/no-extraneous-dependencies */
import dotenv from 'dotenv';
import path from 'path';
import webpack from 'webpack';

// Override webpack config defaults
export default {
  webpack(config, env, helpers) {
    // Remove PostCSS config
    const postcssLoader = helpers.getLoadersByName(config, 'postcss-loader');
    postcssLoader.forEach(({ loader }) => delete loader.options);

    // Add .env file support
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(
          dotenv.config({
            path: path.join(__dirname, '.env'),
          }).parsed,
        ),
      }),
    );
  },
};
