const Route = require('lib/router/route')
const lov = require('lov')

const {DataSetRow, AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/request',
  validator: lov.array().items([
    lov.object().keys({
      uuid: lov.string().required(),
      newAdjustment: lov.string().required()
    }).required()
  ]),
  handler: async function (ctx) {
    var data = ctx.request.body
    var returnData = {}

    for (let row of data) {
      const datasetRow = await DataSetRow.findOne({'uuid': row.uuid, 'isDeleted': false})
        .populate('adjustmentRequest')
      ctx.assert(datasetRow, 404, 'DataSetRow no encontrado')

      var adjustmentRequest = datasetRow.adjustmentRequest

      if (!adjustmentRequest) {
        adjustmentRequest = await AdjustmentRequest.create({
          organization: datasetRow.organization,
          project: datasetRow.project,
          dataset: datasetRow.dataset,
          datasetRow: datasetRow._id,
          lastAdjustment: datasetRow.data.localAdjustment,
          newAdjustment: row.newAdjustment,
          requestedBy: ctx.state.user._id
        })

        datasetRow.adjustmentRequest = adjustmentRequest
        await datasetRow.save()
      } else {
        adjustmentRequest.status = 'created'
        adjustmentRequest.lastAdjustment = datasetRow.data.localAdjustment
        adjustmentRequest.newAdjustment = row.newAdjustment
        adjustmentRequest.requestedBy = ctx.state.user
      }

      await adjustmentRequest.save()

      returnData[row.uuid] = adjustmentRequest.toPublic()
    }

    ctx.body = {data: returnData}
  }
})
