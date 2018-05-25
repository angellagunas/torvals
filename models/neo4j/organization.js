var _ = require('lodash');

var Organization = require('../neo4j/generic/organization');
var Dataset = require('../neo4j/generic/dataset');

var create = function (session, properties) {
  const query = `MATCH (org:Organization {uuid: {uuid}})
                 RETURN org`
  return session.run(query, {uuid: properties.uuid})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {organization: 'organization uuid already in use', status: 400}
      } else {
        return session.run(`
          CREATE (org:Organization {uuid: {uuid}, name: {name}})
          RETURN org`,
          {
            uuid: properties.uuid,
            name: properties.name
          }
        ).then(results => {
            return new Organization(results.records[0].get('org'));
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

var _singleOrganizationWithDetails = function (record) {
  if (record.length) {
    var result = {};
    _.extend(result, new Organization(
      record.get('org')
    ));

    result.datasets = _.map(record.get('datasets'), record => {
      return new Dataset(record);
    });
    return result;
  } else {
    return null;
  }
};

var getAll = function(session) {
  return session.run('MATCH (org:Organization) RETURN org')
    .then(_manyOrganizations);
};

var _manyOrganizations = function (result) {
  return result.records.map(r => new Organization(r.get('org')));
};

// get a single movie by id
var getById = function (session, organizationId) {
  var query = `
    MATCH (org:Organization {uuid: {organizationId}})
    OPTIONAL MATCH (org)<-[:RATED]-(ds:Dataset)
    RETURN org,
    collect(DISTINCT Dataset.uuid) AS datasets
  `

  return session.run(query, {
    organizationId: organizationId
  }).then(result => {
    if (!_.isEmpty(result.records)) {
      return _singleOrganizationWithDetails(result.records[0]);
    }
    else {
      throw {message: 'organization not found', status: 404}
    }
  });
};

module.exports = {
  getAll: getAll,
  getById: getById,
  create: create
};
