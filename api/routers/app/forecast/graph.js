const Route = require('lib/router/route')
const moment = require('moment')

const {Forecast, Product} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/graphData/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid
    var filter = ''

    if (ctx.request.query.id) {
      filter = ctx.request.query.id
    }

    const forecast = await Forecast.findOne({'uuid': forecastId, 'isDeleted': false})

    ctx.assert(forecast, 404, 'Forecast not found')

    var objects = new Set(forecast.graphData.map(item => {
      return item.producto_id
    }))

    var products = await Product.find({'externalId': { '$in': Array.from(objects) }, 'isDeleted': false})
    products = new Set(products.map(item => {
      return {
        itemId: item.externalId,
        name: item.name
      }
    }))

    if (forecast.graphData) {
      forecast.graphData.sort((a, b) => {
        var dateA = moment(a.ds)
        var dateB = moment(b.ds)

        return dateA - dateB
      })
    }

    if (forecast.aggregated) {
      forecast.aggregated.sort((a, b) => {
        var dateA = moment(a.sds)
        var dateB = moment(b.sds)

        return dateA - dateB
      })
    }

    let data

    if (filter) {
      data = forecast.graphData.filter(item => {
        return item.producto_id === filter
      })
    } else {
      data = forecast.aggregated
    }

    ctx.body = {
      data,
      products: Array.from(products)
    }
  }
})
