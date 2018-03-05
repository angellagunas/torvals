const Route = require('lib/router/route')
const lov = require('lov')

const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var salesCenterId = ctx.params.uuid
    var data = ctx.request.body

    const salesCenter = await SalesCenter.findOne({'uuid': salesCenterId, 'isDeleted': true})
    ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')

    salesCenter.set({
      isDeleted: false
    })

    await salesCenter.save()

    ctx.body = {
      data: salesCenter
    }
  }
})
