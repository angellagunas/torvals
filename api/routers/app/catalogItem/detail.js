const Route = require('lib/router/route')
const {Organization, CatalogItem} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/detail/:uuid',
  handler: async function (ctx) {
    var uuidItem = ctx.params.uuid

    var organization = ctx.state.organization._id
    const org = await Organization.findOne({'_id': organization, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    var catalogItem = await CatalogItem.findOne({uuid: uuidItem}).populate('organization')
    ctx.assert(catalogItem, 'Item no encontrado')

    ctx.body = {
      data: catalogItem.toPublic()
    }
  }
})
