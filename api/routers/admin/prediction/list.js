const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Forecast, Prediction} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'forecast') {
        const forecast = await Forecast.findOne({'uuid': ctx.request.query[filter]})

        if (forecast) {
          filters['forecast'] = ObjectId(forecast._id)
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var predictions = await Prediction.find({isDeleted: false, ...filters})
      .populate(['organization', 'salesCenter', 'product', 'adjustmentRequest'])
      .sort(ctx.request.query.sort || '-dateCreated')

    ctx.body = {
      data: predictions
    }
  }
})
