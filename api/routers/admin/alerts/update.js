const Route = require('lib/router/route')
const lov = require('lov')

const { Alert } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    type: lov.string().required(),
    template: lov.string().required(),
    status: lov.string().required()
  }),
  handler: async function (ctx) {
    var alertId = ctx.params.uuid
    var data = ctx.request.body

    const alert = await Alert.findOne({ 'uuid': alertId, 'isDeleted': false })

    ctx.assert(alert, 404, 'Alerta no encontrada')

    alert.set({
      name: data.name,
      type: data.type,
      template: data.template,
      status: data.status,
      description: data.description || alert.description
    })

    alert.save()

    ctx.body = {
      data: alert.toPublic()
    }
  }
})
