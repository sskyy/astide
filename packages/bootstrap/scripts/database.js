const Sequelize = require('sequelize');
const CodeModel = require('../Code.model')
const CategoryModel = require('../Category.model')
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '../database.sqlite'
});
const Code = sequelize.define('code', CodeModel)
const Category = sequelize.define('category', CategoryModel)

function syncTables(force = false) {
  sequelize.sync({ force })
}

module.exports = { Code, Category, syncTables }
