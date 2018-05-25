var _ = require('lodash');

var CatalogItem = require('../neo4j/generic/catalog-item');

var create = function (session, properties) {
  const query = `MATCH (ci:Item {uuid: {uuid}})
                 RETURN ci`
  return session.run(query, {uuid: properties.uuid})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {catalog-item: 'catalog item uuid already in use', status: 400}
      } else {
        return session.run(`
          CREATE (ci:Item {uuid: {uuid}, id: {id}, name: {name}})
          RETURN ci`,
          {
            uuid: properties.uuid,
            id: properties.id,
            name: properties.name
          }
        ).then(results => {
            return new CatalogItem(results.records[0].get('ci'));
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

var _singleCatalogItemWithDetails = function (record) {
  if (record.length) {
    var result = {};
    _.extend(result, new CatalogItem(
      record.get('ci')
    ));

    return result;
  } else {
    return null;
  }
};

var getAll = function(session) {
  return session.run('MATCH (ci:Item) RETURN ci')
    .then(_manyOrganizations);
};

var _manyOrganizations = function (result) {
  return result.records.map(r => new Organization(r.get('ci')));
};

// get a single movie by id
var getById = function (session, catalogItemId) {
  var query = `
    MATCH (ci:Item {uuid: {catalogItemId}})
    RETURN ci
  `

  return session.run(query, {
    catalogItemId: catalogItemId
  }).then(result => {
    if (!_.isEmpty(result.records)) {
      return _singleCatalogItemWithDetails(result.records[0]);
    }
    else {
      throw {message: 'catalog item not found', status: 404}
    }
  });
};

module.exports = {
  getAll: getAll,
  getById: getById,
  create: create
};
