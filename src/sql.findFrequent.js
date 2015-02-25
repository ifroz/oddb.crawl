var _ = require('lodash');
var sequelize = require('sequelize'),
    Doctor = require('./doctor');

module.exports = function genFrequentFinder(dbFieldName, localFieldName) {
  return function findFrequentWhatevers(options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    return Doctor.findAll(_.assign({
      where: {
        email: null
      },
      attributes: [
        [dbFieldName, localFieldName],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']
      ],
      order: '`cnt` DESC',
      group: [dbFieldName]
    }, options || {})).then(cb);
  };
}