const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Forecast, Project, Product, Prediction, SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'project') {
        const project = await Project.findOne({'uuid': ctx.request.query[filter]})

        if (project) {
          filters['project'] = ObjectId(project._id)
        }

        continue
      }

      if (filter === 'product') {
        const product = await Product.findOne({'uuid': ctx.request.query[filter]})

        const predictions = await Prediction.find({product: product})
        const forecastIds = predictions.map(item => { return item.forecast })

        if (product) {
          filters['_id'] = {$in: forecastIds}
        }

        continue
      }

      if (filter === 'salesCenter') {
        const salesCenter = await SalesCenter.findOne({'uuid': ctx.request.query[filter]})

        const predictions = await Prediction.find({salesCenter: salesCenter})
        const forecastIds = predictions.map(item => { return item.forecast })

        if (salesCenter) {
          filters['_id'] = {$in: forecastIds}
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var forecasts = await Forecast.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      populate: 'organization',
      sort: ctx.request.query.sort || '-dateCreated',
      select: { graphData: 0, aggregated: 0 }
    })

    ctx.body = {
      data: forecasts.data.map(forecast => { return forecast.toPublic() }),
      total: forecasts.total
    }
  }
})
