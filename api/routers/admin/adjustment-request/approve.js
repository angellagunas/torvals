const Route = require('lib/router/route')
const moment = require('moment')

const {AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/approve/:uuid',
  handler: async function (ctx) {
    var adjustmentRequestId = ctx.params.uuid

    const adjustmentRequest = await AdjustmentRequest.findOne({
      'uuid': adjustmentRequestId,
      'isDeleted': false
    }).populate('datasetRow')

    ctx.assert(adjustmentRequest, 404, 'AdjustmentRequest no encontrado')

    const datasetRow = adjustmentRequest.datasetRow

    datasetRow.data.localAdjustment = adjustmentRequest.newAdjustment
    datasetRow.updatedBy = ctx.state.user
    datasetRow.markModified('data')
    await datasetRow.save()

    adjustmentRequest.status = 'approved'
    adjustmentRequest.approvedBy = ctx.state.user
    adjustmentRequest.dateApproved = moment.utc()
    await adjustmentRequest.save()

    ctx.body = {
      data: adjustmentRequest.toAdmin()
    }
  }
})