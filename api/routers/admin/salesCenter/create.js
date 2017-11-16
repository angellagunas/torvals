const Route = require('lib/router/route')
const lov = require('lov')

const {SalesCenter, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const org = await Organization.findOne({uuid: data.organization})

    if (!org) {
      ctx.throw(404, 'Organization not found')
    }

    const salesCenter = await SalesCenter.create({
      name: data.name,
      description: data.description,
      organization: org._id,
      address: data.address,
      externalId: data.externalId
    })

    ctx.body = {
      data: salesCenter
    }
  }
})
