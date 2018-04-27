const Route = require('lib/router/route')
const lov = require('lov')
const { Price } = require('models')
const Api = require('lib/abraxas/api')
const verifyPrices = require('queues/update-prices')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    price: lov.number().required()
  }),
  handler: async function (ctx) {
    var priceId = ctx.params.uuid
    var data = ctx.request.body

    const price = await Price.findOne({'uuid': priceId, 'isDeleted': false}).populate('organization')
    ctx.assert(price, 404, 'Price not found')

    price.set({price: data.price})

    await price.save()

    var res = await Api.updatePrices(price.etag, price.externalId, data.price)
    if (res.status === 'ok') {
      verifyPrices.add({uuid: price.organization.uuid})
    } else {
      ctx.throw(401, 'Error al actualizar precio (Abraxas)')
    }

    ctx.body = {
      data: price.toPublic()
    }
  }
})
