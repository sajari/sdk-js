// Override webpack config defaults
export default {
  webpack(config, env, helpers) {
    // Remove PostCSS config
    const postcssLoader = helpers.getLoadersByName(config, 'postcss-loader');
    postcssLoader.forEach(({ loader }) => delete loader.options);

    // Add custom babel plugins
    const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
    const babelConfig = rule.options;

    // Inline SVGs
    babelConfig.plugins.push('inline-react-svg');
  },
};
