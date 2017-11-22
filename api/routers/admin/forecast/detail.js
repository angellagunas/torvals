const Route = require('lib/router/route')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid

    const forecast = await Forecast.findOne({'uuid': forecastId, 'isDeleted': false})
    ctx.assert(forecast, 404, 'Forecast not found')

    ctx.body = {
      data: forecast.format()
    }
  }
})
