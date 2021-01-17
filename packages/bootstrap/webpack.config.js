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

const devEnginePath = path.resolve('../../../engine/packages')
const projectPath = path.resolve(__dirname, '../../')


module.exports = {
  mode: 'development',
  entry: {
    ide: './ide.js',
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'IDE Example',
      chunks: ['ide'],
      filename: 'ide.html',
      template: 'ide.html',
    }),
    new webpack.DefinePlugin({
      __DEV__: true,
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/page/'
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
      {
        test: /\.less$/,
        use: getStyleLoaders({
          importLoaders: 1,
        }, 'less-loader'),
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
