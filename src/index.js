#!/usr/local/bin/iojs

var oddb = require('./net.oddb');

oddb.query('Erika', function(err, res, body) {
  console.log(JSON.stringify(arguments, undefined, 2));
});


console.log('queried');

/*
process.exit();

// find some unprocessed doctors in our db:
var Doctor = require('./doctor');
Doctor.findAll({
  where: {
    status: 'input' // initial status
  },
  limit: 10
}).on('success', function() {
  console.log(JSON.stringify(arguments, undefined, 2));
});
*/