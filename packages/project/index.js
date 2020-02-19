const webpack = require('webpack');
const express = require('express');
const webpackMiddleware = require('webpack-dev-middleware')
const { Volume } = require('memfs')
const { Union } = require('unionfs')
const fs = require('fs')
// const Sequelize = require('sequelize');

// TODO 分发请求 dev/start/build

function makeFsJSON([categories, codes]) {
  const idToPath = {}

  categories.forEach((category) => {
    // 遵循组件要的数据结构
    const parent = category.parentId ? idToPath[category.parentId] : []
    idToPath[category.id] = parent.concat(category.name)
  })

  const result = {}
  codes.forEach(code => {
    const filePath = code.categoryId ? `/${idToPath[code.categoryId].join('/')}/${code.name}` : `/${code.name}`
    result[filePath] = code.content
  })

  return result
}

// wait for code
console.log('started')
process.on('message', function({ data: categoryAndCode }) {
  console.log('receive code')
  // console.log(categoryAndCode)

  const webpackConfig = require('./webpack.config')
  const compiler = webpack(webpackConfig);
  // TODO change input fileSystem

  const ufs = new Union()
  const jsonFile =makeFsJSON(categoryAndCode)
  console.log(Object.keys(jsonFile))
  const codeFs = Volume.fromJSON(jsonFile)
  ufs.use(codeFs).use(fs)
  compiler.inputFileSystem = ufs

  const app = express();

  // TODO 启动 服务器，
  app.use(express.json())
  app.use(webpackMiddleware(compiler,  {
    publicPath: webpackConfig.output.publicPath,
  }))


  app.listen(4000, () => console.log('Example app listening on port 3000!'))

});


