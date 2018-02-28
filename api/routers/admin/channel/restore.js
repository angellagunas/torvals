const Route = require('lib/router/route')

const { Channel } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var channelId = ctx.params.uuid

    const channel = await Channel.findOne({
      'uuid': channelId,
      'isDeleted': true
    })

    ctx.assert(channel, 404, 'Canal no encontrado')

    channel.set({
      isDeleted: false
    })

    channel.save()

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
