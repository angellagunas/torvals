const Route = require('lib/router/route')
const { Price, Channel, Product } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }
      if (filter === 'general') {
        let $or = []
        if (!isNaN(ctx.request.query[filter])) {
          $or.push({price: ctx.request.query[filter]})
        }

        let channelValues = []
        let channel = await Channel.find({
          name: new RegExp(ctx.request.query[filter], 'i'),
          isDeleted: false
        })
        channel.map(channel => {
          channelValues.push(channel._id)
        })
        if (channelValues.length) {
          $or.push({channel: {$in: channelValues}})
        }

        let productValues = []
        let product = await Product.find({
          '$or': [
                    {name: new RegExp(ctx.request.query[filter], 'i')},
                    {externalId: new RegExp(ctx.request.query[filter], 'i')}
          ],
          isDeleted: false
        })
        product.map(product => {
          productValues.push(product._id)
        })
        if (productValues.length) {
          $or.push({product: {$in: productValues}})
        }

        filters['$or'] = $or
      }
    }

    var prices = await Price.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['channel', 'product']
    })

    prices.data = prices.data.map((price) => { return price.toAdmin() })

    ctx.body = prices
  }
})
