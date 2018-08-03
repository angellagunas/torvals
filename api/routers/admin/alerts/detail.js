const Route = require('lib/router/route')
const { Alert } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    const alertId = ctx.params.uuid
    const alert = await Alert.findOne({
      'uuid': alertId,
      'isDeleted': false
    })
    ctx.assert(alert, 404, 'Alerta no encontrada.')

    ctx.body = {
      data: alert.toAdmin()
    }
  }
})
