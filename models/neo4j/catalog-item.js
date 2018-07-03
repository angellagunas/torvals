var _ = require('lodash');

var CatalogItem = require('../neo4j/generic/catalog-item');

var create = function (session, properties) {
  const query = `MATCH (ci:{label} {uuid: {uuid}})
                 RETURN ci`
  if (!properties.label) {
    throw {catalogItem: 'catalog item label missing', status: 400}
  }
  return session.run(query, {
    label: properties.label,
    uuid: properties.uuid
  })
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {catalogItem: 'catalog item uuid already in use', status: 400}
      } else {
        return session.run(`
          CREATE (ci:{label} {uuid: {uuid}, id: {id}, name: {name}})
          RETURN ci`,
          {
            label: properties.label,
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

var getAll = function(session, label) {
  return session.run('MATCH (ci:{label}}) RETURN ci', {label: label})
    .then(_manyOrganizations);
};

var _manyOrganizations = function (result) {
  return result.records.map(r => new Organization(r.get('ci')));
};

// get a single movie by id
var getById = function (session, label, catalogItemId) {
  var query = `
    MATCH (ci:{label} {uuid: {catalogItemId}})
    RETURN ci
  `

  return session.run(query, {
    label: label,
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

var multiple = function (session, orgId, properties) {
  // First part create new nodes.
  const merge_query_nodes = _.map(properties, function(item) {
    return `MERGE (ci:${item.label} {_id: "${item.uuid}"})
            ON CREATE SET ci.name="${item.name}"
            RETURN ci`
  })
  _.forEach(merge_query_nodes, function(value) {
    session.run(value)
      .then(results => {
        // Done.
      })
      .catch(function(error) {
        console.log(error)
      })
  })
  // Second part create relationship between those nodes.
  const match_query_nodes = _.map(properties, function(item) {
    return `MATCH (ci${item.label}:${item.label} {_id: "${item.uuid}"})`
  })
  match_query_nodes.push(match_query_nodes[0])
  const query_nodes = _.map(properties, function(item) {
    return `(ci${item.label})`
  })
  query_nodes.push(query_nodes[0])

  _.forEach(match_query_nodes, function(v, k) {
    if (typeof match_query_nodes[k + 1] === 'undefined') {
      // Skipt this.
    } else {
      const match_query_nodes_single = _.join([v, match_query_nodes[k + 1]], ' ')
      const query_nodes_rel = `${query_nodes[k]}-[:HAS]->${query_nodes[k + 1]}`
      const query = `${match_query_nodes_single}
                     MERGE ${query_nodes_rel}
                     RETURN 1`
      session.run(query)
        .then(results => {
          // Done
        })
    }
  })
  return true
};

module.exports = {
  getAll: getAll,
  getById: getById,
  create: create,
  multiple: multiple
};
