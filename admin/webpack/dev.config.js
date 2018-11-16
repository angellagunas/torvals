const path = require('path')
const webpack = require('webpack')
const config = require('config')

module.exports = {
  context: __dirname,
  entry: [
    'babel-polyfill',
    'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
    '../frontend/index.js'
  ],
  output: {
    path: __dirname,
    publicPath: config.server.adminPrefix + '/assets',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0', 'react']
        }
      },
      {
        test: /\.(css|scss)/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /\.(jpe|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        loader: 'file-loader'
      }
    ]
  },
  devtool: '#source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'ENV': JSON.stringify(config.env),
      'PREFIX': JSON.stringify(config.server.adminPrefix),
      'API_HOST': JSON.stringify(config.server.apiHost),
      'APP_HOST': JSON.stringify(config.server.appHost),
      'EMAIL_SEND': JSON.stringify(config.mailer.active),
      'COOKIE_SUFIX': JSON.stringify(config.server.cookieSufix),
      'ANALYTICS_ID': JSON.stringify(config.analitycs.id)
    })
  ],
  resolve: {
    modules: ['node_modules'],
    alias: {
      '~base': path.resolve('./lib/frontend/'),
      '~core': path.resolve('./admin/frontend/core'),
      '~components': path.resolve('./admin/frontend/components')
    }
  }
}
