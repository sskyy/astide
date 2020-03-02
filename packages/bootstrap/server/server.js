const webpack = require('webpack');
const express = require('express');
const webpackMiddleware = require('webpack-dev-middleware')
const webpackConfig = require('../webpack.config')
const compiler = webpack(webpackConfig);
import useCodeDatabase from './codeDatabase'
import useSubProcessCommand from './subProcessCommand'
import useFeatures from './features'
const app = express()
const pm2 = require('pm2')
const util = require('util')

pm2.connectP = util.promisify(pm2.connect)
pm2.startProcessP = util.promisify(pm2.start)
pm2.stopP = util.promisify(pm2.stop)
pm2.sendDataToProcessP = util.promisify(pm2.sendDataToProcessId)


app.use(express.json())
app.use(webpackMiddleware(compiler,  {
  publicPath: webpackConfig.output.publicPath,
}))


useCodeDatabase(app)
useSubProcessCommand(app, pm2)
useFeatures(app, pm2)


app.listen(3000, () => console.log('IDE backend listening on port 3000. Visit ide.html for entry'))