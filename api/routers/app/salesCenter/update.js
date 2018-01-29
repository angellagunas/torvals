const Route = require('lib/router/route')
const lov = require('lov')

const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var salesCenterId = ctx.params.uuid
    var data = ctx.request.body

    const salesCenter = await SalesCenter.findOne({
      'uuid': salesCenterId,
      'isDeleted': false}).populate('organization')
    ctx.assert(salesCenter, 404, 'SalesCenter not found')

    salesCenter.set({
      name: data.name,
      description: data.description,
      address: data.address,
      externalId: data.externalId,
      isNewExternal: false
    })

    salesCenter.save()

    ctx.body = {
      data: salesCenter
    }
  }
})
