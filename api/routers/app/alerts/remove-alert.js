const Route = require('lib/router/route')
const lov = require('lov')

const {Organization, Alert} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/delete/:uuid',
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

    let orgAlert = org.alerts.findIndex(a => String(a.alert) === String(alert._id))

    if (orgAlert >= 0) {
      org.alerts.splice(orgAlert, 1)
      org.markModified('alerts')
      await org.save()
    } else {
      ctx.throw(400, 'No existe la alerta en la organización.')
    }

    ctx.body = {
      data: org.toPublic()
    }
  }
})