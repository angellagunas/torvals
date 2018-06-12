const Route = require('lib/router/route')
const {Group, CatalogItem} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/group',
  handler: async function (ctx) {
    const catalogItemId = ctx.params.uuid

    const catalogItem = await CatalogItem.findOne({'uuid': catalogItemId}).populate('organization')
    ctx.assert(catalogItem, 404, 'Catálogo no encontrado')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Grupo no encontrado')

    if (catalogItem.groups.find(item => { return String(item) === String(group._id) })) {
      ctx.throw(400, 'Solamente se puede agregar al grupo una vez')
    }

    catalogItem.groups.push(group._id)
    await catalogItem.save()

    group.catalogItems.push(catalogItem._id)
    await group.save()

    ctx.body = {
      data: catalogItem.toPublic()
    }
  }
})
