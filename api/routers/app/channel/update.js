const Route = require('lib/router/route')
const lov = require('lov')

const {Channel} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var channelId = ctx.params.uuid
    var data = ctx.request.body

    const channel = await Channel.findOne({'uuid': channelId, 'isDeleted': false})
    .populate('organization')

    ctx.assert(channel, 404, 'Canal no encontrado')

    channel.set({
      name: data.name,
      externalId: data.externalId,
      isNewExternal: false
    })

    channel.save()

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
