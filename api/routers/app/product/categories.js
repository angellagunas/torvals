const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {Product} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/categories',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }
    }

    filters['organization'] = ObjectId(ctx.state.organization._id)

    var products = await Product.find({...filters, isDeleted: false}).distinct('category')

    ctx.body = products
  }
})
