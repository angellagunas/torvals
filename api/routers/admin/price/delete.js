const Route = require('lib/router/route')

const { Price } = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var priceId = ctx.params.uuid

    var price = await Price.findOne({'uuid': priceId})
    ctx.assert(price, 404, 'Price not found')

    price.set({
      isDeleted: true
    })

    await price.save()

    ctx.body = {
      data: price
    }
  }
})
