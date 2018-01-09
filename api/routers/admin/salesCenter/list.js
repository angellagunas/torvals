const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {SalesCenter, Organization, Forecast, Prediction} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'organization') {
        const organization = await Organization.findOne(
          {'uuid': ctx.request.query[filter]}
        )

        if (organization) {
          filters['organization'] = ObjectId(organization._id)
        }

        continue
      }

      if (filter === 'predictions') {
        const forecast = await Forecast.findOne({'uuid': ctx.request.query[filter]})

        if (forecast) {
          const predictions = await Prediction.find({'forecast': ObjectId(forecast._id)}).populate('salesCenter')

          filters['_id'] = { $in: predictions.map(item => { return item.salesCenter._id }) }
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }
    }

    var salesCenters = await SalesCenter.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    ctx.body = salesCenters
  }
})
