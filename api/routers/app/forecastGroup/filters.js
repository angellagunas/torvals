const Route = require('lib/router/route')
const {CatalogItem} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/filters',
  handler: async function (ctx) {
    const data = ctx.request.body

    var catalogItems = await CatalogItem.find({uuid: {$in: data.catalogItems}, isDeleted: false})
    catalogItems.data = catalogItems.map(item => {
      return item.toPublic()
    })

    ctx.body = catalogItems.data
  }
})
