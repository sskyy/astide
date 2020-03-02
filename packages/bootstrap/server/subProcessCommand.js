const {Code, Category, syncTables} = require('../scripts/database')

export default function useSubProcessCommand(app, pm2) {
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
        script : path.join(projectPath, 'index.js'),         // Script to be run
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
}