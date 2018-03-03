const Route = require('lib/router/route')
const { Price } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var priceId = ctx.params.uuid

    const price = await Price.findOne({'uuid': priceId, 'isDeleted': true})
    ctx.assert(price, 404, 'Price not found')

    price.set({
      isDeleted: false
    })

    price.save()

    ctx.body = {
      data: price.toAdmin()
    }
  }
})
