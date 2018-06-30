const { Organization } = require('models')
const { organizationFixture } = require('../fixtures')

module.exports = function createOrganization (opts = {}) {
  return Organization.create(Object.assign({}, organizationFixture, opts))
}
