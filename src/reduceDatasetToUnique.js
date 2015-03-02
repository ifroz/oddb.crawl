'use strict';
var inputFileName = 'such.output';
var outputFileName = 'doctors.formatted.json';
var fs = require('fs'),
    _ = require('lodash'),
    S = require('string');
var compare = require('./compare');

var getFromFile = function(path) {
  return JSON.parse(fs.readFileSync(path));
};
var saveToFile = function(path, obj) {
  fs.writeFileSync(path, JSON.stringify(obj));
};

var format = require('./format');
var formatDataset = function(dataset) {
  return _.map(dataset, format);
};

var formattedDataset = formatDataset(getFromFile(inputFileName));

//saveToFile(outputFileName, formattedDataset);
//var unmatchedData = _.indexBy(formattedDataset, 'id');

//console.log('HELL YEAh', formattedDataset);

var chunkifyName = function(d) {
  return _([d.firstName, d.lastName].join(' ').split(' ')).compact().
      map(function(w) {
        return S(w).latinise().s;
      }).filter(function(word) {
        return word.replace('.', '').length > 2;
      }).value();
};

var entities = _.map(formattedDataset, function(row) {
  var ret = _.assign(_.omit(row, 'matchesJson', 'country'), {
    nameChunks: chunkifyName(row),
    phoneNumbers: _.compact([row.phone, row.mobilePhone, row.fax])
  });
  //console.log(ret);
  return ret;
});

var onePhoners = _.filter(entities, function(entity) {
  return entity.phoneNumbers.length === 1;
});
var multiPhoners = _.filter(entities, function(entity) {
  return entity.phoneNumbers.length > 1;
});

var phoneNumberMatches = _(onePhoners).groupBy(function(entity) {
  return entity.phoneNumbers[0];
}).filter(function(entityGroup) {
  return entityGroup.length > 1;
}).value();


console.log(entities[0]);
console.log(entities.length);
console.log('phoneNumberMatches');
console.log(phoneNumberMatches.length);
//var indexedEntities = _.indexBy(entities, 'id');
//var unmatchedEntities = _.clone(indexedEntities);
//var matches = {};
//
//_.each(indexedEntities, function(entity, id) {
//  var matchesForEntity = _.filter(entities, function(unmatched) {
//    console.log(entity.nameChunks)
//    var commonNameChunks = _.intersection(entity.nameChunks, unmatched.nameChunks);
//    return (commonNameChunks.length ===
//      _.min(entity.nameChunks.length, unmatched.nameChunks.length));
//  });
//  console.log(entity.id, matchesForEntity);
//});

/*
var matchToRemaining = function(needle, haystack) {
  var matches = {};
  var matchingRows = _(haystack).filter(function(straw) {
    var result = compare(needle, straw);
    if (result) {
      matches[result.id] = result;
    }
    return result;
  }).value();

};

var findSimilar = function(rows) {
  var similars = [];
  _.each(rows, function(row) {
    var matches = matchToRemaining(row, )
  });
};
*/



//saveToFile('doctors.scored.json', findSimilar(formattedDataset));
