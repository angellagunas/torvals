const Route = require('lib/router/route')

const {Channel} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var channelId = ctx.params.uuid

    var channel = await Channel.findOne({'uuid': channelId})
    ctx.assert(channel, 404, 'Channel not found')

    channel.set({isDeleted: true})
    channel.save()

    ctx.body = {
      data: channel.format()
    }
  }
})
