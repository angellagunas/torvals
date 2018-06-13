const Route = require('lib/router/route')
const {Group, CatalogItem} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/group',
  handler: async function (ctx) {
    const catalogItemId = ctx.params.uuid

    const catalogItem = await CatalogItem.findOne({'uuid': catalogItemId}).populate('organization')
    ctx.assert(catalogItem, 404, 'Canal no encontrado')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Grupo no encontrado')

    var pos = catalogItem.groups.indexOf(group._id)
    catalogItem.groups.splice(pos, 1)
    catalogItem.save()

    pos = group.catalogItems.indexOf(catalogItem._id)
    group.catalogItems.splice(pos, 1)
    await group.save()

    ctx.body = {
      data: catalogItem.toPublic()
    }
  }
})
