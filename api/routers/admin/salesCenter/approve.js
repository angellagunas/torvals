const Route = require('lib/router/route')
const lov = require('lov')

const { SalesCenter } = require('models')

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
      const salesCenter = await SalesCenter.findOne({
        'uuid': item.uuid,
        'isDeleted': false
      })

      if (!salesCenter) {
        errorCounter += 1
        errorArray.push(item)
      } else {
        salesCenter.set({
          isNewExternal: false
        })

        await salesCenter.save()
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
