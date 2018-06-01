const Route = require('lib/router/route')
const {Organization, CatalogItem} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    var uuidItem = ctx.params.uuid

    var organization = ctx.state.organization._id
    const org = await Organization.findOne({'_id': organization, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    const findCatalog = org.rules.catalogs.find(item => { return item === data.type })

    if (!findCatalog) {
      ctx.throw(404, 'Catálogo no encontrado')
    }

    var catalogItem = await CatalogItem.findOne({uuid: uuidItem}).populate('organization')
    ctx.assert(catalogItem, 'Item no encontrado')

    catalogItem.set({
      type: data.type,
      name: data.name,
      externalId: data.externalId
    })

    await catalogItem.save()

    ctx.body = {
      data: catalogItem.toPublic()
    }
  }
})
