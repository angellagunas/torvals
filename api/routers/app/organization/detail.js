const Route = require('lib/router/route')

const {Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organization not found')
    }

    const org = await Organization.findOne({'uuid': organizationId})
    ctx.assert(org, 404, 'Organization not found')

    ctx.body = {
      data: org.format()
    }
  }
})
