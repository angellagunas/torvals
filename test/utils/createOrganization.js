const { Organization } = require('models')

module.exports = function createOrganization (opts = {}) {
  const org = {
    name: 'Organization test',
    description: 'Little description about the organization'
  }

  return Organization.create(Object.assign({}, org, opts))
}
