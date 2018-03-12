const Route = require('lib/router/route')

const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var salesCenterId = ctx.params.uuid

    var salesCenter = await SalesCenter.findOne({'uuid': salesCenterId})
    ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')

    salesCenter.set({
      isDeleted: true
    })

    await salesCenter.save()

    ctx.body = {
      data: salesCenter
    }
  }
})
