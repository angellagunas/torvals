const Route = require('lib/router/route')
const ObjectId = require('mongodb').ObjectID
const { Organization, CatalogItem, Catalog } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/create',
  handler: async function (ctx) {
    var data = ctx.request.body
    var organization = ctx.state.organization._id

    const org = await Organization.findOne({'_id': organization, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    const catalog = await Catalog.findOne({
      organization: ObjectId(org._id),
      slug: data.type
    })
    ctx.assert(catalog, 404, 'Catalogo no encontrado')

    let catalogItem = await CatalogItem.create({
      type: data.type,
      name: data.name,
      externalId: data.externalId,
      organization: org._id,
      catalog: ObjectId(catalog._id)
    })
    catalogItem = await CatalogItem.findOne({_id: catalogItem._id}).populate('organization')


    ctx.body = {
      data: catalogItem.toPublic()
    }
  }
})
