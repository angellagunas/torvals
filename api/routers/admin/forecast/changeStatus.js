const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const lov = require('lov')

const {Forecast, PredictionHistoric, Prediction} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/change/:uuid',
  validator: lov.object().keys({
    status: lov.string().required()
  }),
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid
    var data = ctx.request.body

    const forecast = await Forecast.findOne({'uuid': forecastId, 'isDeleted': false})
    ctx.assert(forecast, 404, 'Forecast no encontrado')

    forecast.set({
      status: data.status
    })

    await forecast.save()

    if (forecast.status === 'readyToOrder') {
      const predictions = await Prediction.find({
        'forecast': ObjectId(forecast._id),
        'isDeleted': false
      })

      for (var prediction of predictions) {
        if (prediction.data.adjustment !== prediction.data.prediction) {
          await PredictionHistoric.create({
            updatedBy: prediction.data.updatedBy,
            lastAdjustment: prediction.data.lastAdjustment,
            newAdjustment: prediction.data.adjustment,
            prediction: prediction.data.prediction,
            predictionObj: prediction,
            organization: prediction.organization
          })
        }
      }
    }

    ctx.body = {
      data: forecast.toAdmin()
    }
  }
})
