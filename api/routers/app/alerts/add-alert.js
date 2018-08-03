const Route = require('lib/router/route')
const lov = require('lov')

const {Organization, Alert} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    alert: lov.string().uuid().required()
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    const alertId = ctx.request.body.alert

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    let alert = await Alert.findOne({uuid: alertId, isDeleted: false})
    ctx.assert(alert, 404, 'Alerta no encontrada')

    org.alerts.push({
      alert: alert._id,
      users: []
    })
    org.markModified('alerts')
    await org.save()

    ctx.body = {
      data: org.toPublic()
    }
  }
})
