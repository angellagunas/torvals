const Route = require('lib/router/route')

const {Channel} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var channelId = ctx.params.uuid
    const channel = await Channel.findOne({'uuid': channelId, 'isDeleted': false})
    .populate('organization').populate('groups')
    ctx.assert(channel, 404, 'Canal no encontrado')

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
