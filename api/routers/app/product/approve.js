const Route = require('lib/router/route')
const lov = require('lov')

const { Product } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/approve',
  validator: lov.array().items([
    lov.object().keys({
      uuid: lov.string().required()
    }).required()
  ]),
  handler: async function (ctx) {
    var data = ctx.request.body
    let successCounter = 0
    let errorCounter = 0
    let errorArray = []

    for (let item of data) {
      const product = await Product.findOne({
        'uuid': item.uuid,
        'isDeleted': false,
        'organization': ctx.state.organization
      })

      if (!product) {
        errorCounter += 1
        errorArray.push(item)
      } else {
        product.set({
          isNewExternal: false
        })

        await product.save()
        successCounter += 1
      }
    }

    ctx.body = {
      success: successCounter,
      error: errorCounter,
      errorArray
    }
  }
})
