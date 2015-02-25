var _ = require('lodash'),
    S = require('string');

var formatName = function(d) {
  return _([d.firstName, d.lastName].join(' ').split(' ')).compact().
      map(function(w) {
        return S(w).latinise().s;
      }).filter(function(word) {
        return word.replace('.', '').length > 2;
      }).join(' ');
};

var fields = {
  phone: ['phone', 'mobilePhone', 'fax']
};

module.exports = {
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
    }
    return false;
  },

  phone: function(a, b) { // Swiss phone number preformat
    return !_.isEmpty(_.intersection.apply(null, _.map([a, b], function(doc) {
      return _(doc).pick(fields.phone).values().map(function(phoneNumber) {
        return phoneNumber.replace(/^00?/, '41'); // swiss country code.
      }).value();
    })));
  },

  city: function(oddb, sql) {
    return oddb.address && sql.city ? oddb.address.indexOf(sql.city) > -1 : false;
  },

  address: function(oddb, sql) {
    if (oddb.address && sql.address) {
      if (oddb.address.indexOf(sql.address) > -1)
        return 'exact';
      var sqlWords = _.compact(sql.address.split(' '));
      return sqlWords === _.filter(oddb.address.split(' '), function(oddbWord) {
            return _.contains(sqlWords, oddbWord);
          });
    }
    return false;
  }
};