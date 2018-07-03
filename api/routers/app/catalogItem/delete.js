const Route = require('lib/router/route')
const {Organization, CatalogItem, Group} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var uuidItem = ctx.params.uuid

    var organization = ctx.state.organization._id
    const org = await Organization.findOne({'_id': organization, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    var catalogItem = await CatalogItem.findOne({uuid: uuidItem}).populate('organization')
    ctx.assert(catalogItem, 'Item no encontrado')

    for (let group of catalogItem.groups) {
      let groupObj = await Group.findOne({_id: group})
      let pos = groupObj.catalogItems.indexOf(catalogItem._id)
      groupObj.catalogItems.splice(pos, 1)
      await groupObj.save()
    }

    catalogItem.set({
      isDeleted: true,
      groups: []
    })

    await catalogItem.save()

    ctx.body = {
      data: 'OK'
    }
  }
})
