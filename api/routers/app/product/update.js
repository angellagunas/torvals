const Route = require('lib/router/route')
const lov = require('lov')

const {Product} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var productId = ctx.params.uuid
    var data = ctx.request.body

    const product = await Product.findOne({
      'uuid': productId,
      'isDeleted': false
    }).populate('organization')
    ctx.assert(product, 404, 'Producto no encontrado')

    product.set({
      name: data.name,
      description: data.description,
      cost: data.cost,
      category: data.category,
      subcategory: data.subcategory,
      externalId: data.externalId,
      isNewExternal: false
    })

    product.save()

    ctx.body = {
      data: product.toPublic()
    }
  }
})
