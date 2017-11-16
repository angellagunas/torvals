const Route = require('lib/router/route')
const lov = require('lov')

const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const salesCenter = await SalesCenter.create({
      name: data.name,
      description: data.description,
      organization: ctx.state.organization._id,
      address: data.address,
      externalId: data.externalId
    })

    ctx.body = {
      data: salesCenter
    }
  }
})
