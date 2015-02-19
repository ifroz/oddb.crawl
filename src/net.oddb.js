var request = require('request');
var cfg = require('./config');
var cheerio = require('cheerio');
var _ = require('lodash');

var getSearchUrl = function(term, range) {
  return cfg.oddbUrl + encodeURIComponent(term) + (range ? '?range=' + range : '');
};

var self = {
  query: function(term, cb) {
    request.get(getSearchUrl('Erika'), function(err, res, body) {
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

      cb(null, _(rows).filter(function(row) {
        return row[row.length - 1] === 'vCard';
      }).map(function(row) {
        return {
          firstName: row[1].trim(),
          lastName:  row[0].trim(),
          phone:     row[2].trim(),
          address:   row[3].trim(),
          title:     row[4].trim()
        };
      }).value());
    });
  },
  ranges: ['a-d', 'e-h', 'i-l', 'm-p', 'q-t', 'u-z']
};


module.exports = self;