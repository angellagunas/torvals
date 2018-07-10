const Route = require('lib/router/route')
const {CatalogItem, Catalog} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/filters',
  handler: async function (ctx) {
    const data = ctx.request.body

    var catalogs = await Catalog.find({uuid: {$in: data.catalogs}, isDeleted: false})
    catalogs.data = catalogs.map(item => {
      return item._id
    })

    var catalogItems = await CatalogItem.find({catalog: {$in: catalogs.data}, isDeleted: false})
    catalogItems.data = catalogItems.map(item => {
      return item.toPublic()
    })

    ctx.body = catalogItems.data
  }
})
