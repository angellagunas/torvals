const Route = require('lib/router/route')

const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var salesCenterId = ctx.params.uuid

    const salesCenter = await SalesCenter.findOne({'uuid': salesCenterId, 'isDeleted': false}).populate('organization').populate('groups')
    ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')

    ctx.body = {
      data: salesCenter.toAdmin()
    }
  }
})
