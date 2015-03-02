var _ = require('lodash'),
    async = require('async'),
    fs = require('fs');
var Doctor = require('./doctor');
var matchDatasets = require('./matchDatasets');
var fileName = 'such.output';
var compare = require('./compare');
var format = require('./format');
var deferredUpdate = require('./sql.deferredUpdate');


var getFromFile = function() {
  return JSON.parse(fs.readFileSync(fileName));
};

var getFromDB = function() {
  var startedAt = new Date();
  Doctor.all().then(function(res) {
    var endedAt = new Date();
    console.log('IT TOOK',  endedAt - startedAt, 'ms');
    fs.writeFileSync(fileName, JSON.stringify(res));
  }, _.ary(console.log, 1));
};

var reduceDataset = function(docs) {
  var formatted = _.map(docs, format);
  return _.reduce(formatted, function(uniqueDataset, doc) {
    var similars = _.filter(formatted, function(d) { return compare(d, doc); });
    console.log(similars.length);
    if (similars.length >= 1) {
      var similarIds = _.map(_.pluck(similars, 'id'), _.ary(parseInt, 1));
      var similarStr = similarIds.join(' ');

      //var payload = _.map(similars, function(d) {
      //  return { id: parseInt(d.id), similars: similarStr };
      //});
      //var options = { updateOnDuplicate: ['similars'] };
      //console.log(payload, options);

      var payload = _.map(similars, function(d) {
        return {
          id: parseInt(d.id),
          similars: similarStr
        };
      });
      console.log(JSON.stringify(payload, null, 0).replace("\n", ' '));
      deferredUpdate(payload, false, ['similars']);
      //  Doctor.bulkCreate(payload, options).then(console.log, console.log);
      uniqueDataset.push(similars);
    } else {
      console.log('NO MATCH', Date.now());
    }
    return uniqueDataset;
  }, []);
  //deferredUpdate([], true, ['similars']);
};



fs.writeFileSync('reduced.out', reduceDataset(getFromFile()));
