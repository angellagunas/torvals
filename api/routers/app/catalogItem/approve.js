const Route = require('lib/router/route')
const lov = require('lov')

const { CatalogItem } = require('models')

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
      const cItem = await CatalogItem.findOne({
        'uuid': item.uuid,
        'isDeleted': false,
        'organization': ctx.state.organization
      })

      if (!cItem) {
        errorCounter += 1
        errorArray.push(item)
      } else {
        cItem.set({
          isNewExternal: false
        })

        await cItem.save()
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
