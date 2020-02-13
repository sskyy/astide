const createIframeLoader = require('./createIframeLoader')
const path = require('path')

module.exports = createIframeLoader({
  entry: path.resolve(__dirname, 'axiiComponentEntry.js'),
  host: path.resolve(__dirname, 'axiiComponentHost.js')
})