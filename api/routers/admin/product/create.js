const Route = require('lib/router/route')
const lov = require('lov')

const {Product, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const org = await Organization.findOne({uuid: data.organization})

    if (!org) {
      ctx.throw(404, 'Organization not found')
    }

    const product = await Product.create({
      name: data.name,
      description: data.description,
      cost: data.cost,
      organization: org._id,
      category: data.category,
      subcategory: data.subcategory
    })

    ctx.body = {
      data: product.format()
    }
  }
})
