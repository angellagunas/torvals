const Route = require('lib/router/route')

const {Group} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var groupId = ctx.params.uuid

    var group = await Group.findOne({'uuid': groupId}).populate('users')
    ctx.assert(group, 404, 'Grupo no encontrado')

    group.set({isDeleted: true})

    for (var user of group.users) {
      var pos = user.groups.indexOf(group._id)
      user.groups.splice(pos, 1)
      await user.save()
    }

    for (var channel of group.channels) {
      pos = channel.groups.indexOf(group._id)
      channel.groups.splice(pos, 1)
      await channel.save()
    }

    group.set({users: [], channels: []})

    await group.save()

    ctx.body = {
      data: group.toPublic()
    }
  }
})
