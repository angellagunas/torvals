const Route = require('lib/router/route')
const lov = require('lov')

const {Product, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    var productId = ctx.params.uuid
    var data = ctx.request.body

    const product = await Product.findOne({
      'uuid': productId,
      'isDeleted': false
    }).populate('organization')
    ctx.assert(product, 404, 'Product not found')

    const org = await Organization.findOne({uuid: data.organization})
    ctx.assert(org, 404, 'Organization not found')

    data.organization = org

    product.set({
      name: data.name,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      organization: data.organization
    })

    product.save()

    ctx.body = {
      data: product.format()
    }
  }
})
