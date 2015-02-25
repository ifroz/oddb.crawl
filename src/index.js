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


var columnName = 'name_1', fieldName = 'lastName';
//var columnName = 'name_2', fieldName = 'firstName';
//genFrequentFinder('name_1', 'lastName')(
genFrequentFinder(columnName, fieldName)(function(results) {
  async.eachSeries(results, function forEachFrequentField(result, callback) {
    var queryTerm = result.values[fieldName];

    if (!queryTerm) { return callback(); }

    var fileName = './jsons/' + fieldName + '/' + S(queryTerm).trim().camelize().s.replace('/', '_') + '.json';
    var fileExists = fs.existsSync(fileName);


    var sqlQuery = { email: null };
    sqlQuery[fieldName] = queryTerm;


    //if (fileExists) {
    //  console.log('SKIPPING', queryTerm);
    //  return callback(null, []);
    //}
    async.parallel({
      sql: sqlWhere(sqlQuery),
      oddb: function(callback) {
        if (fileExists) {
          console.log('ODDB FROM FILE', queryTerm);
          callback(null, JSON.parse(
              fs.readFileSync(fileName, { encoding: 'utf8' })));
        } else {
          var terms = _.filter(
              queryTerm.replace('.', '').replace('-', ' ').split(' '),
              function(w) {
                return w.length > 2;
              });
          console.log('ODDB QUERYING: ', queryTerm, terms);
          async.mapSeries(terms, _.ary(oddb.query, 2), function(err, oddbResponses) {
            callback(err, err ? null : _.flatten(oddbResponses));
          });
        }
      }
    }, function(err, res) {
      if (!fileExists) {
        fs.writeFileSync(fileName, JSON.stringify(res.oddb));
      }

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

function matchDatasets(oddbDoctors, sqlDoctors) {
  return _.map(sqlDoctors, function(sqlDoctor) {
    return _(oddbDoctors).map(function(oddbDoctor) {
      var matchResult = compare(oddbDoctor, sqlDoctor);
      return (!matchResult) ? false : {
        id: sqlDoctor.id,
        email: oddbDoctor.email,
        doctor: oddbDoctor,
        matches: matchResult,
        timestamp: Date.now()
      };
    }).compact().value();
  });
}


var matchers = require('./matchers');

var countMatches = function(results) {
  return _.reduce(results, function(cnt, isMatched) {
    return _.isString(isMatched) || isMatched === true ? cnt + 1 : cnt;
  }, 0);
};

function compare(oddbDoctor, sqlDoctor) {
  var formatted = { a: format(oddbDoctor), b: format(sqlDoctor) };
  var matchResults = _.mapValues(matchers, function(fn) {
    return fn(formatted.a, formatted.b);
  });
  return matchResults.name && (
            //matchResults.name === 'exact' ||
            countMatches(matchResults) >= 2
         ) ? matchResults : false;
}

function format(a) {
  return _.reduce(a, function(formatted, originalValue, key) {
    var val = (originalValue) ? originalValue.toString().trim() : originalValue;
    if (!val || val === '') {
      return formatted;
    } else if ( _.includes(['firstName', 'lastName'], key) ) {
      formatted[key] = val.replace(/[ -]+/g, ' ').trim();
    } else if ( _.includes(['phone', 'mobilePhone', 'fax'], key) ) {
      formatted[key] = val.replace(/\D+/ig, '');
    } else if ( key.indexOf('Id') === -1 ){
      formatted[key] = val;
    }
    return formatted;
  }, {});
}