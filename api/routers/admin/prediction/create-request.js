const Route = require('lib/router/route')
const lov = require('lov')
const moment = require('moment')

const {Prediction, AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/request',
  validator: lov.object().keys({
    newAdjustment: lov.number()
  }),
  handler: async function (ctx) {
    var predictionId = ctx.params.uuid
    var data = ctx.request.body

    const prediction = await Prediction.findOne({'uuid': predictionId, 'isDeleted': false})
      .populate('adjustmentRequest')
    ctx.assert(prediction, 404, 'Predicción no encontrada')

    var adjustmentRequest = prediction.adjustmentRequest

    if (!adjustmentRequest) {
      adjustmentRequest = await AdjustmentRequest.create({
        organization: prediction.organization,
        project: prediction.project,
        forecast: prediction.forecast,
        prediction: prediction,
        lastAdjustment: prediction.data.adjustment,
        newAdjustment: data.newAdjustment,
        requestedBy: ctx.state.user
      })

      prediction.adjustmentRequest = adjustmentRequest
    } else {
      adjustmentRequest.status = 'created'
      adjustmentRequest.lastAdjustment = prediction.data.adjustment
      adjustmentRequest.newAdjustment = data.newAdjustment
      adjustmentRequest.requestedBy = ctx.state.user
    }

    prediction.data.lastAdjustment = prediction.data.adjustment
    prediction.data.adjustment = adjustmentRequest.newAdjustment
    prediction.data.updatedBy = ctx.state.user
    prediction.markModified('data')
    await prediction.save()

    adjustmentRequest.status = 'approved'
    adjustmentRequest.approvedBy = ctx.state.user
    adjustmentRequest.dateApproved = moment.utc()
    await adjustmentRequest.save()

    ctx.body = {data: 'OK'}
  }
})
