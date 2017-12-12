const Route = require('lib/router/route')
const lov = require('lov')

const {Prediction} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    adjustment: lov.number()
  }),
  handler: async function (ctx) {
    var predictionId = ctx.params.uuid
    var data = ctx.request.body

    const prediction = await Prediction.findOne({'uuid': predictionId, 'isDeleted': false})
    ctx.assert(prediction, 404, 'Prediction not found')

    prediction.data.lastAdjustment = prediction.data.adjustment
    prediction.data.adjustment = data.adjustment
    prediction.markModified('data')
    prediction.save()

    ctx.body = {
      data: prediction.format()
    }
  }
})
