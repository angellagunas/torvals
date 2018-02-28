const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')

const {DataSetRow, AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/request',
  validator: lov.object().keys({
    newAdjustment: lov.number()
  }),
  handler: async function (ctx) {
    var datasetRowId = ctx.params.uuid
    var data = ctx.request.body

    const datasetRow = await DataSetRow.findOne({'uuid': datasetRowId, 'isDeleted': false})
      .populate('adjustmentRequest')
    ctx.assert(datasetRow, 404, 'DataSetRow no encontrado')

    var adjustmentRequest = datasetRow.adjustmentRequest

    if (!adjustmentRequest) {
      adjustmentRequest = await AdjustmentRequest.create({
        organization: datasetRow.organization,
        project: datasetRow.project,
        dataset: datasetRow.dataset,
        datasetRow: datasetRow,
        lastAdjustment: datasetRow.data.adjustment,
        newAdjustment: data.newAdjustment,
        requestedBy: ctx.state.user
      })

      datasetRow.adjustmentRequest = adjustmentRequest
    } else {
      adjustmentRequest.status = 'created'
      adjustmentRequest.lastAdjustment = datasetRow.data.adjustment
      adjustmentRequest.newAdjustment = data.newAdjustment
      adjustmentRequest.requestedBy = ctx.state.user
    }

    datasetRow.data.lastAdjustment = datasetRow.data.adjustment
    datasetRow.data.adjustment = adjustmentRequest.newAdjustment
    datasetRow.data.updatedBy = ctx.state.user
    datasetRow.markModified('data')
    await datasetRow.save()

    adjustmentRequest.status = 'approved'
    adjustmentRequest.approvedBy = ctx.state.user
    adjustmentRequest.dateApproved = moment.utc()
    await adjustmentRequest.save()

    ctx.body = {data: 'OK'}
  }
})
