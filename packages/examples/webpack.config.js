const path = require('path')
const webpack = require('webpack')
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

const devEnginePath = path.resolve('../../../@ariesate/engine/packages')

console.log(path.resolve(devEnginePath, 'controller-axii/src/index.js'),)

module.exports = {
  mode: 'development',
  entry: {
    editor: './editor/editor.js',
    ide: './ide/ide.js',
    fs: './fs/fs.js',
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Editor Example',
      chunks: ['editor'],
      filename: 'editor.html',
      template: './editor/editor.html',
    }),
    new HtmlWebpackPlugin({
      title: 'IDE Example',
      chunks: ['ide'],
      filename: 'ide.html',
      template: 'common-template.html',
    }),
    new HtmlWebpackPlugin({
      title: 'FS Example',
      chunks: ['fs'],
      filename: 'fs.html',
      template: 'common-template.html',
    }),
    new webpack.DefinePlugin({
      __DEV__: true,
    })
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
    alias: {
      astide: path.resolve('../ide/src'),
      axii: path.resolve(devEnginePath, 'controller-axii/src/index.js'),
      '@ariesate/are': path.resolve(devEnginePath, 'engine'),
    },
  },
}
