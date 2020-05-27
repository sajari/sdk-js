// Override webpack config defaults
export default {
  webpack(config, env, helpers) {
    // Add custom babel plugins
    const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
    const babelConfig = rule.options;

    // Inline SVGs
    babelConfig.plugins.push('inline-react-svg');

    // Fix strange issue with URL package alias
    // https://preact.slack.com/archives/C3M9NTD16/p1590535624120100
    delete config.resolve.alias.url;
  },
};
