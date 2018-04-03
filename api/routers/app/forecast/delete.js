const Route = require('lib/router/route')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid

    var forecast = await Forecast.findOne({'uuid': forecastId}).populate('users')
    ctx.assert(forecast, 404, 'Forecast no encontrado')

    forecast.set({isDeleted: true})

    forecast.save()

    ctx.body = {
      data: forecast.toPublic()
    }
  }
})
