const Route = require('lib/router/route')

const { Group, Channel, SalesCenter } = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var groupId = ctx.params.uuid

    var group = await Group.findOne({'uuid': groupId}).populate('users')
    ctx.assert(group, 404, 'Grupo no encontrado')

    group.set({isDeleted: true})

    for (let user of group.users) {
      let pos = user.groups.indexOf(group._id)
      user.groups.splice(pos, 1)
      await user.save()
    }

    let salesCenters = await SalesCenter.find({
      groups: {$in: [group]},
      organization: group.organization
    })

    for (let salesCenter of salesCenters) {
      let pos = salesCenter.groups.indexOf(group._id)
      salesCenter.groups.splice(pos, 1)
      await salesCenter.save()
    }

    let channels = await Channel.find({
      groups: { $in: [group] },
      organization: group.organization
    })

    for (let channel of channels) {
      let pos = channel.groups.indexOf(group._id)
      channel.groups.splice(pos, 1)
      await channel.save()
    }

    group.set({users: [], channels: []})

    await group.save()

    ctx.body = {
      data: group.toAdmin()
    }
  }
})
