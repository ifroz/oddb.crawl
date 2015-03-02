var emails [];
var _ = require('lodash'),
    async = require('async');
var Doctor = require('./doctor');

var i = 0;
async.eachSeries(
    _(emails).
        groupBy('email').
        //map(function(objs) { return _.pluck(objs, 'id'); }).
        filter(function(objs) {
          return objs.length === 1;
        }).
        chunk(20).
        value(),
    function(chunks, cb) {
      Doctor.bulkCreate(_.flatten(chunks), {
        updateOnDuplicate: ['email']
      }).then(function() {
        console.log('SOOO DONE @ chunk:', ++i);
        cb();
      }).catch(function() {
        console.log(arguments);
        console.log('WHAT ERROR');
      })
    }, function(err, res) {
      console.log(arguments);
      console.log('TOTALLY DONE');
    }
);