const Route = require('lib/router/route')

const {Channel} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/uuid',
  handler: async function (ctx) {
    var channelId = ctx.params.uuid
    const channel = await Channel.findOne({'uuid': channelId, 'isDeleted': false})
    ctx.assert(channel, 404, 'Channel not found')

    ctx.body = {
      data: channel.format()
    }
  }
})
