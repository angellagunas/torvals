const Route = require('lib/router/route')
const { Anomaly, Project, DataSetRow } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    var batchSize = 1000

    var bulkOps = []
    var updateBulk = []

    for (var anomaly of data.anomalies) {
      try {
        anomaly = await Anomaly.findOne({uuid: anomaly.uuid})
        if (anomaly) {
          bulkOps.push({
            updateOne: {
              'filter': {_id: anomaly._id},
              'update': {$set: {isDeleted: true}}
            }
          })
          updateBulk.push({
            'organization': anomaly.organization,
            'project': anomaly.project,
            'dataset': project.activeDataset._id,
            'apiData': anomaly.apiData,
            'product': anomaly.product,
            'salesCenter': anomaly.salesCenter,
            'channel': anomaly.channel,
            'cycle': anomaly.cycle,
            'period': anomaly.period,
            'data': {
              ...anomaly.data,
              'prediction': anomaly.prediction,
              'sale': anomaly.data.sale,
              'forecastDate': anomaly.date,
              'semanaBimbo': anomaly.data.semanaBimbo,
              'adjustment': anomaly.prediction,
              'localAdjustment': anomaly.prediction
            }
          })
        }

        if (bulkOps.length === batchSize) {
          console.log(`${batchSize} anomalies saved!`)
          await Anomaly.bulkWrite(bulkOps)
          bulkOps = []
          await DataSetRow.insertMany(updateBulk)
          updateBulk = []
        }
      } catch (e) {
        ctx.throw(500, 'Error recuperando las anomalías')
      }
    }

    try {
      if (bulkOps.length > 0) {
        await Anomaly.bulkWrite(bulkOps)
        await DataSetRow.insertMany(updateBulk)
      }
    } catch (e) {
      ctx.throw(500, 'Error recuperando las anomalías')
    }

    ctx.body = {
      data: 'ok'
    }
  }
})
