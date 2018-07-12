const Route = require('lib/router/route')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/delete/',
  handler: async function (ctx) {
    var data = ctx.request.body

    var forecasts = await Forecast.find({ 'uuid': {$in: data.forecasts} }).populate('users dataset')
    ctx.assert(forecasts, 404, 'Forecast no encontrado')

    for (let forecast of forecasts) {
      if (forecast.status === 'conciliatingPrediction' || forecast.status === 'ready') {
        continue
      }

      forecast.set({isDeleted: true})

      await forecast.save()

      forecast.dataset.set({
        isDeleted: true
      })

      await forecast.dataset.save()
    }

    ctx.body = {
      data: forecasts
    }
  }
})
