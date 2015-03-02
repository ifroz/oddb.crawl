var inputFile = 'reduce.json.rows';
var _ = require('lodash');
var fs = require('fs');

var rows = fs.readFileSync(inputFile, 'utf8').split("\n");
var Doctor = require('./doctor');

_(rows).
    flatten().
    chunk(100).
    each(function(chunkString) {
      console.log('eachChunk');
      //console.log(chunkString);
      var chunk = JSON.parse(('[' + chunkString + ']').replace(',]', ']'));
      //console.log(_.flatten(chunk));
      Doctor.bulkCreate(_.flatten(chunk), {
        updateOnDuplicate: ['similars']
      }).then(function(res) {
        console.log('SQL: OK');
      }, function(err) {
        console.log('SQL: ERROR');
      });
    }).
    value();