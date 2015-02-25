#!/usr/local/bin/iojs

var _ = require('lodash');
var S = require('string');
var async = require('async');
var fs = require('fs');
var oddb = require('./net.oddb');
var sequelize = require('sequelize'),
    Doctor = require('./doctor');

//genFrequentFinder('name_1', 'lastName')(
genFrequentFinder('name_2', 'firstName')(
    function(results) {
  async.eachSeries(results, function(result, callback) {
    var queryTerm = result.values.firstName;
    //var queryTerm = result.values.lastName;

    if (!queryTerm) { return callback(); }

    var fileName = S(queryTerm).trim().camelize().s.replace('/', '_') + '.json';
    var fileExists = fs.existsSync(fileName);

    if (fileExists) {
      process.nextTick(function() {
        callback();
      });
      return;
    }

    async.parallel({
      sql: sqlWhere({
        firstName: queryTerm,
        email: null
        //lastName: queryTerm
      }),
      oddb: function(cb) {
        if (fileExists) {
          cb(null, JSON.parse(fs.readFileSync(fileName, { encoding: 'utf8' })));
        } else {
          oddb.query(queryTerm, cb);
        }
      }
    }, function(err, res) {

      if (!fileExists) {
        fs.writeFileSync(fileName, JSON.stringify(res.oddb));
      } else {
        return callback(null, null);
      }
      var matches = matchDatasets( _.filter(res.oddb, 'email'), res.sql );
      var found = _.filter(matches, function(m) {
        return _.compact(m).length > 0;
      });
      if (found.length) {
        fs.writeFileSync(
            fileName.replace('.json', '.found.json'),
            JSON.stringify(found, null, ''));
      }
      var stat = {
        name: queryTerm,
        total: matches.length,
        found: found.length,
        withoutEmail: res.oddb.length - found.length
      };
      stat.percentage = stat.found / stat.total;

      console.log('STAT:: ', stat);
      //console.log('### * ### * ### * ### * ### * ### * ### * ### * ### * ###');
      callback(err, err ? null : matches);
    });
  });
});


function genFrequentFinder(dbFieldName, localFieldName) {
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

function sqlWhere(whereClause) {
  return function(cb) {
    Doctor.findAll({
      where: whereClause
    }).then(function(res) {
      cb(null, _.pluck(res, 'dataValues'));
    }).catch(function(err) { cb(err); });
  };
}

function matchDatasets(srcDoctors, destDoctors) {
  return _.map(destDoctors, function(sqlDoctor) {
    var matches = _.filter(srcDoctors, function(oddbDoctor) {
      if (compare(oddbDoctor, sqlDoctor)) {
        return {
          localId: sqlDoctor.localId,
          nameA: _.pick(sqlDoctor, 'firstName', 'lastName'),
          nameB: _.pick(oddbDoctor, 'firstName', 'lastName'),
          email: oddbDoctor.email
        };
      }
      return false;
    });
    var info = {
      sql: sqlDoctor,
      oddb: matches,
      oddbCount: matches.length,
      hasOneMatch: matches.length === 1
    };

    if (info.hasOneMatch) {
      //console.log('MATCHED(ONE)             ', info.sql.id, info.oddb[0].email);
    }
    //if (info.oddbCount) { console.log('DEBUG(FOUND_ANY)::', JSON.stringify(info, null, 2)); }

    return matches;
  });
}

var formatName = function(d) { // the whole name in one string
  var str = d.firstName + ' ' + d.lastName;
  return _(str.trim().split(' ')).compact().filter(function(word) {
    return word.replace(/\./g, '').length > 2;
  }).join(' ');
};

var matchers = {
  name: function compareNames(a, b) {
    var doctors = _.mapValues({a: a, b: b}, function(doc) {
      var obj = { name: formatName(doc) };
      obj.words = obj.name.split(' ');
      obj.wordCount = obj.words.length;
      return obj;
    });

    if (doctors.a.name === doctors.b.name) {
      return 'exact'; // fully matching name
    }

    if (doctors.a.wordCount !== doctors.b.wordCount) {
      var commonWords = _.intersection(doctors.a.words, doctors.b.words);
      if (commonWords.length === _(doctors).values().pluck('wordCount').min()) {
        return 'partial'; // words are matching
      }
    } else {
      return false;
    }
  },
  phone: function comparePhoneNumbers(a, b) {
    return !_.isEmpty(_.intersection.apply(null,
        _([a, b]).
            pick(['phone', 'mobilePhone', 'fax']).
            map(_.values).
            map(function(strings) {
              return _.map(strings, function formatPhoneNumber(phoneNumber) {
                return phoneNumber.replace(/[^0-9]/ig, '');
              });
            }).
            value()));
  },
  city: function(oddb, sql) {
    return oddb.address ? oddb.address.indexOf(sql.city) > -1 : false;
  },

};



function compare(oddbDoctor, sqlDoctor) {
  var formatted = { a: format(oddbDoctor), b: format(sqlDoctor) };
  var matchResults = _.mapValues(matchers, function(fn) {
    return fn(formatted.a, formatted.b);
  });

  if (matchResults.name === 'exact') {
    console.log('MATCH(EXACT)', sqlDoctor.id, oddbDoctor.email, "\n" +
        JSON.stringify(matchResults), '::ID::',
        sqlDoctor.id,
        JSON.stringify(oddbDoctor));
    return true;
  } else if (matchResults.name === 'partial' && matchResults.phone) {
    console.log('MATCH(PARTIAL_WITH_PHONE)', sqlDoctor.id, oddbDoctor.email);
    return true;
  } else if (matchResults.name === 'partial' && matchResults.city) {
    console.log('MATCH(PARTIAL_WITH_CITY )', sqlDoctor.id, oddbDoctor.email);
  } else if (matchResults.phone) {
    console.log('MATCH(PHONE_ONLY        )', sqlDoctor.id, oddbDoctor.email);
    return false;
  } else {
    return false;
  }
}

function format(a) {
  return _.reduce(a, function(formatted, originalValue, key) {
    var val = (originalValue) ? originalValue.toString().trim() : originalValue;
    if (!val || val === '') {
      return formatted;
    } else if ( _.includes(['firstName', 'lastName'], key) ) {
      formatted[key] = val.trim().replace(/\W+/g, ' ');
    } else if ( _.includes(['phone', 'mobilePhone', 'fax'], key) ) {
      formatted[key] = val.replace(/\D+/ig, '');
    }
    return formatted;
  }, {});
}