const Route = require('lib/router/route')
const {Group, Channel} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/group',
  handler: async function (ctx) {
    const channelId = ctx.params.uuid

    const channel = await Channel.findOne({'uuid': channelId})
    ctx.assert(channel, 404, 'Canal no encontrado')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Grupo no encontrado')

    const channelVerificate = await Channel.findOne({'groups': group._id})
    if (channelVerificate) {
      ctx.throw(400, 'El grupo solo puede ser asignado a un canal')
    }

    if (channel.groups.find(item => { return String(item) === String(group._id) })) {
      ctx.throw(400, 'Solamente se puede agregar al grupo una vez')
    }

    channel.groups.push(group._id)
    await channel.save()

    group.channels.push(channel._id)
    await group.save()

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
