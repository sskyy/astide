const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    require.resolve('style-loader'),
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
  ]
  if (preProcessor) {
    loaders.push(require.resolve(preProcessor));
  }
  return loaders;
};

module.exports = {
  mode: 'development',
  entry: {
    ide: './basic/basic.js',
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Basic Example',
      chunks: ['ide'],
      filename: 'ide.html',
      template: 'common-template.html',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            rootMode: 'upward',
          },
        },

      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(scss|sass)$/,
        use: getStyleLoaders({
          importLoaders: 1,
        }, 'sass-loader'),
      },
    ],
  },
  resolve: {
    // symlinks: true
    alias: {
      astide: path.resolve('../ide/src')
    },
  },
}
