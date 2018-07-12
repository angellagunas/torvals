const Route = require('lib/router/route')
const lov = require('lov')
const { Price } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    price: lov.number().required()
  }),
  handler: async function (ctx) {
    var priceId = ctx.params.uuid
    var data = ctx.request.body

    const price = await Price.findOne({
      'uuid': priceId,
      'isDeleted': false
    }).populate('organization')

    ctx.assert(price, 404, 'Price not found')

    price.set({price: parseFloat(data.price)})
    await price.save()

    ctx.body = {
      data: price.toPublic()
    }
  }
})
