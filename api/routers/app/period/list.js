const Route = require('lib/router/route')

const {Organization, Period} = require('models')

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

    var periods = await Period.find({organization: org._id, isDeleted: false}).populate('cycle')

    periods.data = periods.map(item => {
      return item.toPublic()
    })

    ctx.body = {
      data: periods.data
    }
  }
})
