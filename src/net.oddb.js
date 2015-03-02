var cfg = require('./config');
var _ = require('lodash'),
    async = require('async'),
    cheerio = require('cheerio'),
    request = require('request');

var getSearchUrl = function(term, range) {
  return cfg.oddbUrl + encodeURIComponent(term) + (range ? '?range=' + range : '');
};

var hasPagination = function(rows) {
  var paginators = _.filter(rows, function(row) {
    var bool = row.length === 1 && row[0].match(/[a-q]-[d-z]\s\|\s[a-q]-[d-z]/);
    return !!bool;
  });
  return paginators.length >= 1; // === 1;
};

var isDataRow = function(row) {
  return row[row.length - 1] === 'vCard';
};

var hasEmail = function(row) {
  return row.address.split('\n').pop().match('@') > 0;
};

var setRandomTimeout = function(fn, delayFrom, delayTo) {
  return setTimeout(fn, Math.random() * (delayTo - delayFrom) + delayFrom);
};

var self = {
  query: function(term, callback) {
    console.log('ODDB QUERYING', term);
    self.queryPage(term, function(err, response) {
      if (err) {
        return self.delay(function() { callback(err); });
      }

      var finalResults = response.results;
      if (response.hasPagination) {
        async.mapSeries(self.ranges.slice(1), function(range, cb) {
          self.delay(function() { self.queryPage(term, range, cb); });
        }, function(err, pageResponses) {
          callback(err, err ? null : finalResults.concat(
              _(pageResponses).pluck('results').flatten().value()));
        });
      } else {
        self.delay(function() { callback(null, finalResults); });
      }
    });
  },
  queryPage: function(term, range, cb) {
    if (typeof range === 'function') {
      cb = range;
      range = undefined;
    }
    request.get(getSearchUrl(term, range), function(err, res, body) {
      if (err) { return cb(err); }

      var rows = [];
      var $ = cheerio.load(body);

      $('table tr').each(function(i, tr) {
        var values = [];
        var tds = $(tr).children('td');
        tds.each(function(i, elt) {
          values.push($(elt).text());
        });
        rows.push(values);
      });

      var results = _(rows).filter(isDataRow).map(function(row) {
        var item = {
          firstName: row[1].trim(),
          lastName:  row[0].trim(),
          phone:     row[2].trim(),
          address:   row[3].trim(),
          title:     row[4].trim()
        };
        if (item.address.match('@')) {
          item.email = item.address.split('\n').pop().trim();
        }
        return item;
      }).value();

      var hasMultiplePages = hasPagination(rows);
      cb(null, {
        results: results,
        hasPagination: hasMultiplePages,
        range: range || hasMultiplePages ? self.ranges[0] : undefined
      });
    });
  },

  delay: function(fn) {
    return setRandomTimeout(fn, self.delayMin, self.delayMax);
  },
  delayMin: 500,
  delayMax: 1000,

  ranges: ['a-d', 'e-h', 'i-l', 'm-p', 'q-t', 'u-z']
};


module.exports = self;