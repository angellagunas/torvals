const Route = require('lib/router/route')
const { Price } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/deleted',
  handler: async function (ctx) {
    var prices = await Price.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: true},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['product', 'channel']
    })

    prices.data = prices.data.map((price) => { return price.toAdmin() })

    ctx.body = prices
  }
})
