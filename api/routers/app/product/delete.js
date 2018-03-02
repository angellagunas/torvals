const Route = require('lib/router/route')

const {Product} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var productId = ctx.params.uuid

    var product = await Product.findOne({'uuid': productId})
    ctx.assert(product, 404, 'Producto no encontrado')

    product.set({
      isDeleted: true
    })

    await product.save()

    ctx.body = {
      data: product.format()
    }
  }
})
