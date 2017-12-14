const Route = require('lib/router/route')

const {Forecast} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid

    const forecast = await Forecast.findOne({'uuid': forecastId, 'isDeleted': false})
      .populate('createdBy')
      .populate('organization')
      .populate('project')

    ctx.assert(forecast, 404, 'Forecast not found')

    forecast.graphData.sort((a, b) => {
      var dateA = moment(a.ds)
      var dateB = moment(b.ds)

      return dateA - dateB
    })

    ctx.body = {
      data: forecast.format()
    }
  }
})
