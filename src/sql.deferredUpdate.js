var _ = require('lodash');
var buffer = [],
    chunkSize = 10;
var sequelize = require('sequelize'),
    Doctor = require('./doctor');

function flush(updateFields) {
  console.log('SQLOMG FLUSHING', buffer);
  Doctor.bulkCreate(_.clone(buffer), {
    updateOnDuplicate: updateFields || ['email', 'matchesJson', 'similars']
  }).then(function() {
    console.log('SQLOMG SOOO DONE');
  }).catch(function(err) {
    console.log(err);
  });

  buffer = [];
}

module.exports = function deferredUpdate(rows, force, updateFields) {
  //if (!_.isArray(rows)) rows = [rows];
  buffer = buffer.concat(_.compact(rows));
  console.log('SQLOMG SOOO LENGTH', buffer.length);
  if (buffer.length >= chunkSize || force) {
    flush(updateFields);
  }
};