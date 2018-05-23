const Route = require('lib/router/route')
const { Anomaly, Project, DataSetRow } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.findOne({uuid: ctx.params.uuid})
    ctx.assert(project, 404, 'Proyecto no encontrado')

    var batchSize = 1000

    var bulkOps = []
    var updateBulk = []

    for (var anomaly of data.anomalies) {
      try {
        anomaly = await Anomaly.findOne({uuid: anomaly.uuid})
        console.log(anomaly)
        if (anomaly) {
          bulkOps.push({
            updateOne: {
              'filter': {_id: anomaly._id},
              'update': {$set: {isDeleted: true}}
            }
          })
          updateBulk.push({
            updateOne: {
              'filter': {_id: anomaly.datasetRow},
              'update': {$set: { isAnomaly: false, 'data.prediction': anomaly.prediction }}
            }
          })
        }

        if (bulkOps.length === batchSize) {
          console.log(`${batchSize} anomalies saved!`)
          await Anomaly.bulkWrite(bulkOps)
          bulkOps = []
          await DataSetRow.bulkWrite(updateBulk)
          updateBulk = []
        }
      } catch (e) {
        ctx.throw(500, 'Error recuperando las anomalías')
      }
    }

    try {
      if (bulkOps.length > 0) {
        await Anomaly.bulkWrite(bulkOps)
        await DataSetRow.bulkWrite(updateBulk)
      }
    } catch (e) {
      ctx.throw(500, 'Error recuperando las anomalías')
    }

    project.set({status: 'pendingRows'})
    project.save()

    ctx.body = {
      data: 'ok'
    }
  }
})
