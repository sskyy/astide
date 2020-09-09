const {Code, Category, syncTables} = require('../scripts/database')

module.exports = function useCodeDatabase(app) {
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
}