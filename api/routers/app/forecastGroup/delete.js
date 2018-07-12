const Route = require('lib/router/route')

const {ForecastGroup} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid

    var forecastGroup = await ForecastGroup.findOne({'uuid': forecastId}).populate('users dataset').populate({
      path: 'forecasts',
      populate: {path: 'dataset'}
    })
    ctx.assert(forecastGroup, 404, 'forecastGroup no encontrado')

    if (forecastGroup.status === 'conciliated') {
      ctx.throw('422', 'El forecast se encuentra conciliado y no puede ser eliminado')
    }

    forecastGroup.set({isDeleted: true})

    await forecastGroup.save()

    for (let forecast of forecastGroup.forecasts) {
      forecast.set({
        isDeleted: true
      })
      await forecast.save()

      forecast.dataset.set({
        isDeleted: true
      })

      await forecast.dataset.save()
    }

    ctx.body = {
      data: forecastGroup.toPublic()
    }
  }
})
