const webpack = require('webpack');
const express = require('express');
const webpackMiddleware = require('webpack-dev-middleware')
const Sequelize = require('sequelize');
const webpackConfig = require('./webpack.config')
const compiler = webpack(webpackConfig);
const {Code, Category, syncTables} = require('./scripts/database')
const app = express()
const pm2 = require('pm2')
const path = require('path')
const util = require('util')

pm2.connectP = util.promisify(pm2.connect)
pm2.startProcessP = util.promisify(pm2.start)
pm2.stopP = util.promisify(pm2.stop)
pm2.sendDataToProcessP = util.promisify(pm2.sendDataToProcessId)


app.use(express.json())
app.use(webpackMiddleware(compiler,  {
  publicPath: webpackConfig.output.publicPath,
}))


// 1. sqlite codebase 的增删改查。
syncTables()

function respond(res, promise) {
  promise.then(result => {
    res.send(result)
  }).catch((error) => {
    console.error(error)
    res.status(500)
    res.send({error})
  })
}

app.get('/db/category/list', (req, res) => {
  respond(res, Promise.all([Category.findAll(), Code.findAll()]))
})

app.post('/db/category/create', (req, res) => {
  respond(res, Category.create(req.body))
})

app.post('/db/code/create', (req, res) => {
  respond(res, Code.create(req.body))
})

app.get('/db/code/get/:uri', (req, res) => {
  respond(res, Code.findOne({ where: { uri: req.params.uri }}))
})

app.post('/db/code/create', (req, res) => {
  respond(res, Code.create(req.body))
})

app.post('/db/code/save', (req, res) => {
  const { uri } = req.body
  const code = Code.findOne({ where: { uri }})
  Object.assign(code, req.body)
  respond(res, code.save())
})

app.post('/db/code/remove', (req, res) => {
  const { uri } = req.body
  const code = Code.findOne({ where: { uri }})
  respond(res, code.destroy())
})

// TODO 接受 dev 命令，开新进程执行 ./project 目录下的 index，传命令给它。
let subProcess = null
const prepareDataForCommand = {
  async dev() {
    return Promise.all([Category.findAll(), Code.findAll()])
  }
}

app.post('/command/:command', async (req, res) => {
  const { command } = req.params
  console.log({ command })
  // TODO 开启新进程
  await pm2.connectP()

  async function startProject() {
    const projectPath = path.resolve(__dirname, '../project')
    const [app] = await pm2.startProcessP({
      script    : path.join(projectPath, 'index.js'),         // Script to be run
      max_memory_restart : '100M',   // Optional: Restarts your app if it reaches 100Mo
      name: 'project',
      output: path.join(projectPath, 'output.log'),
      error: path.join(projectPath, 'error.log'),
    })
    return app
  }

  if (!subProcess) {
    subProcess = await startProject()
  } else {
    // TODO 之后不要
    await pm2.stopP(subProcess.pm_id)
    subProcess = await startProject()
  }

  let data = {}
  if (prepareDataForCommand[command]) {
    data = await prepareDataForCommand[command]()
  }

  const dataResponse = await pm2.sendDataToProcessP({
    id: subProcess.pm_id,
    type : command,
    data,
    topic: 'command'
  })

  console.log(dataResponse)
  res.send("ok")
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))