const Route = require('lib/router/route')
const {ForecastGroup} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid

    var forecast = await ForecastGroup.findOne({uuid: uuid, isDeleted: false})
    .populate('project')
    .populate({
      path: 'forecasts',
      populate: { path: 'engine catalogs' }
    })

    forecast.forecasts = forecast.forecasts.filter(item => item.isDeleted === false)

    ctx.assert(forecast, 404, 'ForecastGroup no encontrado')

    ctx.body = forecast.toPublic()
  }
})
