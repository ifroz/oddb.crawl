#!/usr/local/bin/iojs

var _ = require('lodash');
var S = require('string');
var async = require('async');
var fs = require('fs');
var oddb = require('./net.oddb');
var sequelize = require('sequelize'),
    Doctor = require('./doctor');

findFrequentFirstNames(function(results) {
  async.eachSeries(results, function(result, callback) {
    var queryTerm = result.values.firstName;
    if (!queryTerm) { return callback(); }

    async.parallel({
      oddb: _.partial(oddb.query, queryTerm),
      sql: sqlWhere({ firstName: queryTerm })
    }, function(err, res) {
      fs.writeFileSync(
          S(queryTerm).camelize().s + '.json',
          JSON.stringify(res.oddb));
      var matches = matchDatasets( _.filter(res.oddb, 'email'), res.sql );
      var found = _.filter(matches, function(m) {
        return _.compact(m).length > 0;
      });
      fs.writeFileSync(
          S(queryTerm).camelize().s + '.found.json',
          JSON.stringify(found),
          _.ary(console.log, 1));
      var stat = {
        total: matches.length,
        found: found.length
      };

      stat.percentage = stat.found / stat.total;

      console.log('STAT:: ', stat);
      //console.log('### * ### * ### * ### * ### * ### * ### * ### * ### * ###');
      callback(err, err ? null : matches);
    });
  });
});

function findFrequentFirstNames(options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  return Doctor.findAll(_.assign({
    attributes: [
      ['name_2', 'firstName'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']
    ],
    order: '`cnt` DESC',
    group: ['name_2']
  }, options || {})).then(cb);
}

function sqlWhere(whereClause) {
  return function(cb) {
    Doctor.findAll({
      where: whereClause
    }).then(function(res) {
      cb(null, _.pluck(res, 'dataValues'));
    }).catch(cb);
  };
}

function matchDatasets(srcDoctors, destDoctors) {
  return _.each(destDoctors, function(destDoctor) {
    var matches = _.filter(srcDoctors, function(srcDoctor) {
      if (compare(srcDoctor, destDoctor)) {
        return {
          localId: destDoctor.localId,
          nameA: _.pick(destDoctor, 'firstName', 'lastName'),
          nameB: _.pick(srcDoctor, 'firstName', 'lastName'),
          email: srcDoctor.email
        };
      }
      return false;
    });
    var info = {
      sql: destDoctor,
      oddb: matches,
      oddbCount: matches.length,
      hasOneMatch: matches.length === 1
    };

    if (info.hasOneMatch) {
      console.log('MATCHED(ONE)::', info.sql.localId, info.oddb[0].email);
    }
    if (info.oddbCount) {
      console.log('DEBUG(FOUND_ANY)::', JSON.stringify(info, null, 2));
    }

    return matches;
  });
}

var matchers = {
  name: function compareNames(a, b) {
    var formatName = function(d) { // the whole name in one string
      var str = d.firstName + ' ' + d.lastName;
      return _.compact(str.trim().split(' ')).join(' ');
    };
    var doctors = _.mapValues({a: a, b: b}, function(doc) {
      var obj = { name: formatName(doc) };
      obj.words = obj.name.split(' ');
      obj.wordCount = obj.words.length;
      return obj;
    });

    if (doctors.a.name === doctors.b.name) {
      return true; // fully matching name
    }

    if (doctors.a.wordCount !== doctors.b.wordCount) {
      var commonWords = _.intersection(doctors.a.words, doctors.b.words);
      if (commonWords.length === _(doctors).values().pluck('wordCount').min()) {
        return true; // words are matching
      }
    } else {
      return false;
    }
  },
  phone: function comparePhoneNumbers(a, b) {
    return !_.isEmpty(_.intersection.apply(null,
        _([a, b]).pick(['phone', 'mobilePhone', 'fax']).map(_.values).value()));
  }
};

function compare(a, b) {
  var formatted = { a: format(a), b: format(b) };
  return !!_(matchers).
      mapValues(function(fn) {
        return fn(formatted.a, formatted.b);
      }).value().
      //tap(function(matches) { var found = _(matches).values().includes(true); }).

      name; // name match is good enough.
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