const Route = require('lib/router/route')
const lov = require('lov')
const { Price, Product, Channel } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    product: lov.string().required(),
    channel: lov.string().required(),
    price: lov.number().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const product = await Product.findOne({uuid: data.product})
    ctx.assert(product, 404, 'Producto no encontrado')
    console.log(product)
    const channel = await Channel.findOne({uuid: data.channel})
    ctx.assert(channel, 404, 'Canal no encontrado')
    console.log(channel)
    const price = await Price.create({

      externalId: data.externalId,

      price: data.price,

      product: product._id,

      productExternalId: product.externalId,

      channel: channel._id,

      channelExternalId: channel.externalId,

      etag: data.etag

    })

    ctx.body = {
      data: price.toAdmin()
    }
  }
})
