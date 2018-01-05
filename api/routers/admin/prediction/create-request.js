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
    ctx.assert(prediction, 404, 'Prediction not found')

    await AdjustmentRequest.create({
      organization: prediction.organization,
      project: prediction.project,
      forecast: prediction.forecast,
      prediction: prediction,
      lastAdjustment: prediction.data.adjustment,
      newAdjustment: data.newAdjustment,
      requestedBy: ctx.state.user
    })

    ctx.body = {data: 'OK'}
  }
})
