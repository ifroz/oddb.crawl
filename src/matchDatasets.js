var _ = require('lodash');
var matchers = require('./matchers'),
    format = require('./format'),
    compare = require('./compare');

module.exports = function matchDatasets(oddbDoctors, sqlDoctors) {
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
};