const Route = require('lib/router/route')

const {Product} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var productId = ctx.params.uuid

    const product = await Product.findOne({
      'uuid': productId,
      'isDeleted': false
    }).populate('organization')
    ctx.assert(product, 404, 'Product not found')

    ctx.body = {
      data: product.format()
    }
  }
})
