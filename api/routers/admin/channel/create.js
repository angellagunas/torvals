const Route = require('lib/router/route')
const lov = require('lov')

const {Channel, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required(),
    externalId: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const org = await Organization.findOne({uuid: data.organization})

    if (!org) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const channel = await Channel.create({
      name: data.name,
      organization: org._id,
      externalId: data.externalId
    })

    ctx.body = {
      data: channel.toPublic()
    }
  }
})
