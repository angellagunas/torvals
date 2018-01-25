const Route = require('lib/router/route')
const lov = require('lov')

const {Channel, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required(),
    externalId: lov.string().required()
  }),
  handler: async function (ctx) {
    var channelId = ctx.params.uuid
    var data = ctx.request.body

    const channel = await Channel.findOne({'uuid': channelId, 'isDeleted': false})
    .populate('organization')
    ctx.assert(channel, 404, 'Channel  not found')

    const org = await Organization.findOne({uuid: data.organization})
    ctx.assert(org, 404, 'Organization not found')

    channel.set({
      name: data.name,
      organization: org._id,
      externalId: data.externalId,
      isExternalChannel: data.isExternalChannel || false
    })

    channel.save()

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
