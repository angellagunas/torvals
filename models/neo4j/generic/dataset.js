var _ = require('lodash');
const { v4 } = require('uuid')

var Dataset = module.exports = function (_node) {
  _.extend(this, _node.properties);

  if(!this.uuid) {
    this['uuid'] = v4();
  }
};
