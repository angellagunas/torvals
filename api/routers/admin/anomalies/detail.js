const Route = require('lib/router/route')

const { Anomaly } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var anomalyId = ctx.params.uuid

    const anomaly = await Anomaly.findOne({'uuid': anomalyId, 'isDeleted': false})
    .populate('channel').populate('product').populate('dataset').populate('salesCenter')
    ctx.assert(anomaly, 404, 'Anomaly not found')

    ctx.body = {
      data: anomaly.toAdmin()
    }
  }
})
