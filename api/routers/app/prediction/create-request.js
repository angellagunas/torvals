const Route = require('lib/router/route')
const lov = require('lov')

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
    ctx.assert(prediction, 404, 'Prediction not found')

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

    await prediction.save()
    await adjustmentRequest.save()

    ctx.body = {data: 'OK'}
  }
})
