var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.resolve('src', 'sajari.js'),
  output: {
    filename: 'sajari.js',
    library: "sajar-sdk-js",
    libraryTarget: "commonjs2",
    publicPath: '/'
  },
  plugins: [],
  module: {
    loaders: [
      {
        "test": /\.js?$/,
        "exclude": /node_modules/,
        "loaders": [
          "babel-loader?presets[]=stage-0,presets[]=es2015"
        ]
      }
    ]
  }
};
