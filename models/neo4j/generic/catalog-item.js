var _ = require('lodash');
const { v4 } = require('uuid')

var CatalogItem = module.exports = function (_node) {
  _.extend(this, {
    'id': _node.properties['id'],
    'name': _node.properties['name'],
  });

  if(!this.uuid) {
    this['uuid'] = v4();
  }
};
