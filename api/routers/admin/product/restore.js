const Route = require('lib/router/route')
const lov = require('lov')

const {Product} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var productId = ctx.params.uuid
    var data = ctx.request.body

    const product = await Product.findOne({
      'uuid': productId,
      'isDeleted': true
    })
    ctx.assert(product, 404, 'Product not found')

    product.set({
      isDeleted: false
    })

    product.save()

    ctx.body = {
      data: product.format()
    }
  }
})
