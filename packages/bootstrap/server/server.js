const webpack = require('webpack');
const express = require('express');
const webpackMiddleware = require('webpack-dev-middleware')
const webpackConfig = require('../webpack.config')
const compiler = webpack(webpackConfig);
const useCodeDatabase = require('./codeDatabase')
const useSubProcessCommand = require('./subProcessCommand')
// const useFeatures = require('./features')
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
// useFeatures(app, pm2)


app.listen(3000, () => console.log('IDE backend listening on port 3000. Visit /page/ide.html for entry'))