var _ = require('lodash');

module.exports = function format(a) {
  return _.reduce(a, function(formatted, originalValue, key) {
    var val = (originalValue) ? originalValue.toString().trim() : originalValue;
    if (!val || val === '') {
      return formatted;
    } else if ( _.includes(['firstName', 'lastName'], key) ) {
      formatted[key] = val.replace(/[ -]+/g, ' ').trim();
    } else if ( _.includes(['phone', 'mobilePhone', 'fax'], key) ) {
      formatted[key] = val.replace(/\D+/ig, '');
    } else if ( key && key.indexOf('Id') === -1 ){
      formatted[key] = val;
    }
    return formatted;
  }, {});
};