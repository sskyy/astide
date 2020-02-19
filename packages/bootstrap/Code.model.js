const Sequelize = require('sequelize');

module.exports = {
  // attributes
  uri: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.ARRAY(Sequelize.TEXT),
    allowNull: true,
  },
  categoryId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}