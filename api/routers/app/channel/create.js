const Route = require('lib/router/route')
const lov = require('lov')

const {Channel} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    externalId: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const channel = await Channel.create({
      name: data.name,
      organization: ctx.state.organization._id,
      externalId: data.externalId
    })

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
