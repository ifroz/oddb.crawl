var Sequelize = require('sequelize');
var cfg = require('./config');

module.exports = new Sequelize(cfg.db, {
  define: {
    timestamps: false
  }
});