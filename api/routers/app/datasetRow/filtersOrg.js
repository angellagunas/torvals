const Route = require('lib/router/route')

const {
  CatalogItem,
  Organization
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/filters/organization/:uuid',
  handler: async function (ctx) {
    const orgId = ctx.params.uuid
    const org = await Organization.findOne({uuid: orgId}, {_id: 1})
    const catalogItems = await CatalogItem.find({
      isDeleted: false,
      organization: org._id,
      type: 'centro-de-venta'
    })

    ctx.body = {
      'centro-de-venta': catalogItems
    }
  }
})
