const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {Product, Organization, Prediction, Forecast} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/categories',
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
          const predictions = await Prediction.find({'forecast': ObjectId(forecast._id)}).populate('product')

          filters['_id'] = { $in: predictions.map(item => { return item.product._id }) }
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }
    }

    var products = await Product.find({...filters, isDeleted: false}).distinct('category')

    ctx.body = products
  }
})