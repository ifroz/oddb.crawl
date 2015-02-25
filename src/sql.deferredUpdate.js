var _ = require('lodash');
var Doctor = require('./doctor');
var buffer = [],
    flushCount = 0,
    chunkSize = 10;

function flush() {
  console.log('SQLOMG FLUSHING', buffer);
  Doctor.bulkCreate(buffer, {
    updateOnDuplicate: ['email', 'matchesJson']
  }).then(function() {
    console.log('SQLOMG SOOO DONE');
  }).catch(function(err) {
    console.log(err);
  });

  buffer = [];
}

module.exports = function deferredUpdate(rows, force) {
  //if (!_.isArray(rows)) rows = [rows];
  buffer = buffer.concat(_.compact(rows));
  console.log('SQLOMG SOOO LENGTH', buffer.length);
  if (buffer.length >= chunkSize || force) {
    flush();
  }
};