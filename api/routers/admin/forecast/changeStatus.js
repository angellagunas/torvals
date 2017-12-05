const Route = require('lib/router/route')
const lov = require('lov')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/change/:uuid',
  validator: lov.object().keys({
    status: lov.string().required()
  }),
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid
    var data = ctx.request.body

    const forecast = await Forecast.findOne({'uuid': forecastId, 'isDeleted': false})
    ctx.assert(forecast, 404, 'Forecast not found')

    forecast.set({
      status: data.status
    })

    forecast.save()

    ctx.body = {
      data: forecast.format()
    }
  }
})
