#!/usr/local/bin/iojs

var _ = require('lodash');
var S = require('string');
var async = require('async');
var fs = require('fs');
var oddb = require('./net.oddb');
var sequelize = require('sequelize'),
    Doctor = require('./doctor');
var genFrequentFinder = require('./sql.findFrequent');
var deferredUpdate = require('./sql.deferredUpdate');
var matchDatasets = require('./matchDatasets');


var columnName = 'name_1', fieldName = 'lastName';
//var columnName = 'name_2', fieldName = 'firstName';
//genFrequentFinder('name_1', 'lastName')(
genFrequentFinder(columnName, fieldName)(function(results) {
  async.eachSeries(results, function forEachFrequentField(result, callback) {
    var queryTerm = result.values[fieldName];
    if (!queryTerm) { return callback(); }

    var sqlQuery = { email: null };
    sqlQuery[fieldName] = queryTerm;


    //if (fileExists) {
      //console.log('SKIPPING', queryTerm);
      //return process.nextTick(function() { callback(null, []); });
    //}
    async.parallel({
      sql: sqlWhere(sqlQuery),
      oddb: function(callback) {
        var terms = _.filter(queryTerm.replace('.', '').replace('-', ' ').split(' '),
            function(w) {
              return w.length > 2;
            });
        async.mapSeries(terms, function processQueryTerm(term, cb) {
          var fileName = './jsons/' + fieldName + '/' + S(queryTerm).trim().camelize().s.replace('/', '_') + '.json';
          if ( fs.existsSync(fileName) ) {
            cb(null, JSON.parse(fs.readFileSync(fileName, {encoding: 'utf8'})));
          } else {
            oddb.query(term, function(err, oddbResponse) {
              if (err) { return cb(err); }
              fs.writeFileSync(fileName, JSON.stringify(oddbResponse));
              cb(null, oddbResponse);
            });
          }
        }, function handleResponses(err, oddbResponses) {
          callback(err, err ? null : _.flatten(oddbResponses));
        });
      }
    }, function(err, res) {
      var matches = matchDatasets( _.filter(res.oddb, 'email'), res.sql );
      var found = _.filter(matches, function(m) {
        return _.compact(m).length > 0;
      });

      var stat = {
        name: queryTerm,
        total: matches.length,
        found: found.length,
        withoutEmail: res.oddb.length - found.length,
        percentage: found.length / matches.length,
        worstPercentage: found.length / res.oddb.length
      };
      console.log('STAT:: ', stat);

      //_.filter(found, function(potentialMatches) {
      //  return potentialMatches.length === 1; });

      deferredUpdate(_.map(found, function(potentialMatches) {
        potentialMatches = _.uniq(potentialMatches, function(item){
          return JSON.stringify(item);
        });
        if (potentialMatches.length === 0) { return; }
        var sql = {
          id: potentialMatches[0].id,
          matchesJson: JSON.stringify(potentialMatches),
        };
        if (potentialMatches.length === 1) {
          sql.email = potentialMatches[0].email;
        }
        return sql;
      }));

      callback(err, err ? null : matches);
    });
  }, function(err, res) {
    deferredUpdate([], true);
  });
});

function sqlWhere(whereClause) {
  return function(cb) {
    Doctor.findAll({
      where: whereClause
    }).then(function(res) {
      cb(null, _.pluck(res, 'dataValues'));
    }, _.ary(cb, 1));
  };
}