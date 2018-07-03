var _ = require('lodash');

var Dataset = require('../neo4j/generic/dataset');

var create = function (session, properties) {
  const query = `MATCH (ds:Dataset {uuid: {uuid}})
                 RETURN ds`
  return session.run(query, {uuid: properties.uuid})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {dataset: 'dataset uuid already in use', status: 400}
      } else {
        return session.run(`
          CREATE (ds:Dataset {uuid: {uuid}, name: {name}})
          RETURN ds`,
          {
            uuid: properties.uuid,
            name: properties.name
          }
        ).then(results => {
            return new Dataset(results.records[0].get('ds'));
          }
        ).catch(function(error) {
          console.log(error)
        })
      }
    })
    .catch(function(error) {
      console.log(error)
    })
};

var _singleDatasetWithDetails = function (record) {
  if (record.length) {
    var result = {};
    _.extend(result, new Dataset(
      record.get('ds')
    ));

    return result;
  } else {
    return null;
  }
};

var getAll = function(session) {
  return session.run('MATCH (ds:Dataset) RETURN ds')
    .then(_manyOrganizations);
};

var _manyDatasets = function (result) {
  return result.records.map(r => new Dataset(r.get('ds')));
};

// get a single movie by id
var getById = function (session, datasetId) {
  var query = `
    MATCH (ds:Dataset {uuid: {datasetId}})
    RETURN ds
  `

  return session.run(query, {
    datasetId: datasetId
  }).then(result => {
    if (!_.isEmpty(result.records)) {
      return _singleDatasetWithDetails(result.records[0]);
    }
    else {
      throw {message: 'dataset not found', status: 404}
    }
  });
};

module.exports = {
  getAll: getAll,
  getById: getById,
  create: create
};
