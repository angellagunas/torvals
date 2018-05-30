const _ = require('lodash');
const { v4 } = require('uuid')

var CatalogItem = module.exports = function (_node) {
  _.extend(this, {
    '_id': _node.properties['_id'],
    'name': _node.properties['name'],
  });
};
