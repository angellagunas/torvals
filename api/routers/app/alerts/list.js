const Route = require('lib/router/route')

const {Organization, Alert} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    .populate('alerts.alert alerts.users')
    ctx.assert(org, 404, 'Organización no encontrada')

    const alerts = await Alert.find({isDeleted: false})
    const orgAlerts = org.alerts

    const data = {
      alerts: alerts.map(a => a.toPublic()),
      orgAlerts: orgAlerts
    }

    ctx.body = {
      data: data
    }
  }
})
