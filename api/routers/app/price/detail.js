const Route = require('lib/router/route')

const { Price } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var priceId = ctx.params.uuid

    const price = await Price.findOne({'uuid': priceId, 'isDeleted': false}).populate('channel').populate('product')
    ctx.assert(price, 404, 'Price not found')

    ctx.body = {
      data: price.toAdmin()
    }
  }
})
