const Route = require('lib/router/route')
const lov = require('lov')

const {Organization, Alert, User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/alert/:uuidAlert/add-user',
  validator: lov.object().keys({
    user: lov.string().uuid().required()
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    const alertId = ctx.params.uuidAlert
    var data = ctx.request.body
    const userId = data.user

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada.')

    let alert = await Alert.findOne({uuid: alertId, isDeleted: false})
    ctx.assert(alert, 404, 'Alerta no encontrada.')

    let user = await User.findOne({uuid: userId, isDeleted: false})
    ctx.assert(user, 404, 'Usuario no encontrado.')

    let orgAlert = org.alerts.findIndex(a => String(a.alert) === String(alert._id))

    if (orgAlert >= 0) {
      let userAlert = org.alerts[orgAlert].users.findIndex(u => String(u) === String(user._id))
      if (userAlert >= 0) {
        ctx.throw(400, 'El usuario ya esta asignado a la alerta.')
      } else {
        org.alerts[orgAlert].users.push(user._id)
        org.markModified('alerts')
        await org.save()
      }
    } else {
      ctx.throw(400, 'No existe la alerta en la organización.')
    }

    ctx.body = {
      data: org.toPublic()
    }
  }
})
