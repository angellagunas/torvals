const Route = require('lib/router/route')
const lov = require('lov')

const {Product} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const product = await Product.create({
      name: data.name,
      description: data.description,
      cost: data.cost,
      organization: ctx.state.organization._id,
      category: data.category,
      subcategory: data.subcategory,
      externalId: data.externalId
    })

    ctx.body = {
      data: product.toPublic()
    }
  }
})
