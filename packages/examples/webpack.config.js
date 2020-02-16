const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
const projectPath = path.resolve(__dirname, '../../')


module.exports = {
  mode: 'development',
  entry: {
    // editor: './editor/editor.js',
    ide: './ide/ide.js',
    // fs: './fs/fs.js',
    // paper: './paper/paper.js',
    // iframe: './iframe/iframe.js',
  },
  devtool: 'inline-source-map',
  plugins: [
    new CleanWebpackPlugin(),
    // new HtmlWebpackPlugin({
    //   title: 'Editor Example',
    //   chunks: ['editor'],
    //   filename: 'editor.html',
    //   template: './editor/editor.html',
    // }),
    new HtmlWebpackPlugin({
      title: 'IDE Example',
      chunks: ['ide'],
      filename: 'ide.html',
      template: 'ide/ide.html',
    }),
    // new HtmlWebpackPlugin({
    //   title: 'FS Example',
    //   chunks: ['fs'],
    //   filename: 'fs.html',
    //   template: 'common-template.html',
    // }),
    // new HtmlWebpackPlugin({
    //   title: 'Paper Example',
    //   chunks: ['paper'],
    //   filename: 'paper.html',
    //   template: './paper/paper.html',
    // }),
    // new HtmlWebpackPlugin({
    //   title: 'iframe Example',
    //   chunks: ['iframe'],
    //   filename: 'iframe.html',
    //   template: './iframe/iframe.html',
    // }),
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
      astide: path.resolve(projectPath, 'packages/ide/src'),
      axii: path.resolve(devEnginePath, 'controller-axii/src/index.js'),
      '@ariesate/are': path.resolve(devEnginePath, 'engine'),
    },
  },
  resolveLoader: {
    alias : {
      'axii-component-iframe': path.resolve(projectPath, 'packages/ide/src/base/loaders/axii-component-iframe.js')
    }
  }
}
