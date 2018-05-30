const Route = require('lib/router/route')
const {Organization, CatalogItem} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    const findCatalog = org.rules.catalogs.find(item => { return item === data.type })

    if (!findCatalog) {
      ctx.throw(404, 'Catálogo no encontrado')
    }

    const catalogItem = await CatalogItem.create({
      type: data.type,
      name: data.name,
      externalId: data.externalId,
      organization: org._id
    })

    ctx.body = {
      data: catalogItem.toPublic()
    }
  }
})
