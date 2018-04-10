const Route = require('lib/router/route')
const {Group, Channel} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/group',
  handler: async function (ctx) {
    const channelId = ctx.params.uuid

    const channel = await Channel.findOne({'uuid': channelId})
    ctx.assert(channel, 404, 'Canal no encontrado')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Grupo no encontrado')

    var pos = channel.groups.indexOf(group._id)
    channel.groups.splice(pos, 1)
    channel.save()

    pos = group.channels.indexOf(channel._id)
    group.channels.splice(pos, 1)
    await group.save()

    ctx.body = {
      data: channel.toAdmin()
    }
  }
})
