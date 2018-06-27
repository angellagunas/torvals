const Route = require('lib/router/route')
const lov = require('lov')
const { Price, CatalogItem } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    price: lov.number().required()
  }),
  handler: async function (ctx) {
    var priceId = ctx.params.uuid
    var data = ctx.request.body

    let prod = await CatalogItem.find({uuid: data.product})
    ctx.assert(prod, 404, 'Producto no encontrado')

    let catalogs = []
    for (let item of data.catalogItems) {
      let citem = await CatalogItem.find({uuid: item})
      if (citem) {
        catalogs.push(citem._id)
      }
    }

    const price = await Price.findOne({
      'uuid': priceId,
      'isDeleted': false,
      catalogItems: catalogs,
      product: prod._id

    }).populate('organization')
    ctx.assert(price, 404, 'Price not found')

    ctx.body = {
      data: price.toPublic()
    }
  }
})
