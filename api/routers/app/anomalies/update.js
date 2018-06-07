const Route = require('lib/router/route')
const lov = require('lov')

const {Anomaly} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    prediction: lov.string().required()
  }),
  handler: async function (ctx) {
    var anomalyId = ctx.params.uuid
    var data = ctx.request.body

    const anomaly = await Anomaly.findOne({'uuid': anomalyId, 'isDeleted': false})

    ctx.assert(anomaly, 404, 'Anomalía no encontrada')

    anomaly.set({
      prediction: data.prediction
    })

    await anomaly.save()

    ctx.body = {
      data: anomaly.toPublic()
    }
  }
})
