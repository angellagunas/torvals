const Route = require('lib/router/route')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/rules/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    const data = ctx.request.body

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    org.set({
      rules: data
    })

    await org.save()

    ctx.body = {
      data: org.toPublic()
    }
  }
})
