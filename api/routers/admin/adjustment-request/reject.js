const Route = require('lib/router/route')
const moment = require('moment')

const {AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/reject/:uuid',
  handler: async function (ctx) {
    var adjustmentRequestId = ctx.params.uuid

    const adjustmentRequest = await AdjustmentRequest.findOne({
      'uuid': adjustmentRequestId,
      'isDeleted': false
    })

    ctx.assert(adjustmentRequest, 404, 'AdjustmentRequest no encontrado')

    adjustmentRequest.status = 'rejected'
    adjustmentRequest.rejectedBy = ctx.state.user
    adjustmentRequest.dateRejected = moment.utc()
    await adjustmentRequest.save()

    ctx.body = {
      data: adjustmentRequest.toAdmin()
    }
  }
})
