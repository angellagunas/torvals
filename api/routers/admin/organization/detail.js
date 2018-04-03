const Route = require('lib/router/route')

const {Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    ctx.body = {
      data: org.toAdmin()
    }
  }
})
