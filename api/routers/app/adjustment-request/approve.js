const Route = require('lib/router/route')
const moment = require('moment')

const {AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/approve/:uuid',
  handler: async function (ctx) {
    var adjustmentRequestId = ctx.params.uuid

    const adjustmentRequest = await AdjustmentRequest.findOne({
      'uuid': adjustmentRequestId,
      'isDeleted': false
    }).populate('prediction')

    ctx.assert(adjustmentRequest, 404, 'AdjustmentRequest not found')

    const prediction = adjustmentRequest.prediction

    prediction.data.lastAdjustment = prediction.data.adjustment
    prediction.data.adjustment = adjustmentRequest.newAdjustment
    prediction.data.updatedBy = ctx.state.user
    prediction.markModified('data')
    await prediction.save()

    adjustmentRequest.status = 'approved'
    adjustmentRequest.approvedBy = ctx.state.user
    adjustmentRequest.dateApproved = moment.utc()
    await adjustmentRequest.save()

    ctx.body = {
      data: adjustmentRequest.format()
    }
  }
})
