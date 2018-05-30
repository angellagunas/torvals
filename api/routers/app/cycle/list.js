const Route = require('lib/router/route')

const {Organization, Cycle} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    var cycle = await Cycle.find({organization: org._id, isDeleted: false})

    cycle.data = cycle.map(item => {
      return item.toPublic()
    })

    ctx.body = {
      data: cycle.data
    }
  }
})
