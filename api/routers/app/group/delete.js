const Route = require('lib/router/route')

const { Group, Channel, SalesCenter, CatalogItem } = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    let groupId = ctx.params.uuid

    let group = await Group.findOne({'uuid': groupId}).populate('users')
    ctx.assert(group, 404, 'Grupo no encontrado')

    group.set({isDeleted: true})

    for (let user of group.users) {
      let pos = user.groups.indexOf(group._id)
      user.groups.splice(pos, 1)
      await user.save()
    }

    let salesCenters = await SalesCenter.find({
      groups: {$in: [group]},
      organization: ctx.state.organization._id
    })

    for (let salesCenter of salesCenters) {
      let pos = salesCenter.groups.indexOf(group._id)
      salesCenter.groups.splice(pos, 1)
      await salesCenter.save()
    }

    let channels = await Channel.find({
      groups: { $in: [group] },
      organization: ctx.state.organization._id
    })

    for (let channel of channels) {
      let pos = channel.groups.indexOf(group._id)
      channel.groups.splice(pos, 1)
      await channel.save()
    }

    let catalogItems = await CatalogItem.find({
      groups: {$in: [group]},
      organization: group.organization
    })

    for (let catalogItem of catalogItems) {
      let pos = catalogItem.groups.indexOf(group._id)
      catalogItem.groups.splice(pos, 1)
      await catalogItem.save()
    }

    group.set({users: [], channels: [], catalogItems: []})

    await group.save()

    ctx.body = {
      data: group.toPublic()
    }
  }
})
