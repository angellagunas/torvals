const Route = require('lib/router/route')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid

    var forecast = await Forecast.findOne({'uuid': forecastId}).populate('users dataset')
    ctx.assert(forecast, 404, 'Forecast no encontrado')

    if (forecast.status === 'conciliatingPrediction' || forecast.status === 'ready') {
      ctx.throw('422', 'El forecast se encuentra en conciliación o ya ha finalizado y no puede ser eliminado')
    }

    forecast.set({isDeleted: true})

    await forecast.save()

    forecast.dataset.set({
      isDeleted: true
    })

    await forecast.dataset.save()

    ctx.body = {
      data: forecast.toPublic()
    }
  }
})
