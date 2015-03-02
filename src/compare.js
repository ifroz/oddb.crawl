var _ = require('lodash');
var format = require('./format'),
    matchers = require('./matchers');

function countMatches(results) {
  return _.reduce(results, function(cnt, isMatched) {
    return _.isString(isMatched) || isMatched === true ? cnt + 1 : cnt;
  }, 0);
}

module.exports = function compare(oddbDoctor, sqlDoctor, formatInput) {
  var formatted = (formatInput === false) ?
    { a: oddbDoctor, b: sqlDoctor } :
    { a: format(oddbDoctor), b: format(sqlDoctor) };
  var matchResults = _.mapValues(matchers, function(fn) {
    return fn(formatted.a, formatted.b);
  });
  return matchResults.name && (
    matchResults.name === 'exact' ||
    countMatches(matchResults) >= 2
  ) ? matchResults : false;
};