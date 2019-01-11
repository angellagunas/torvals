const Route = require('lib/router/route')
const {
  Anomaly,
  Project,
  DataSetRow,
  AdjustmentRequest
} = require('models')

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
            'catalogItems': anomaly.catalogItems,
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
          const rows = await DataSetRow.insertMany(updateBulk)
          bulkOps = []
          updateBulk = []

          if (data.rol === 'manager-level-1') {
            for (let datasetRow of rows) {
              const adjustmentRequest = await AdjustmentRequest.create({
                organization: datasetRow.organization,
                project: datasetRow.project,
                dataset: datasetRow.dataset,
                datasetRow: datasetRow._id,
                product: datasetRow.product,
                newProduct: datasetRow.newProduct,
                channel: datasetRow.channel,
                salesCenter: datasetRow.salesCenter,
                lastAdjustment: datasetRow.data.adjustment,
                newAdjustment: datasetRow.data.prediction,
                requestedBy: ctx.state.user._id,
                status: 'created',
                catalogItems: datasetRow.catalogItems,
                period: datasetRow.period,
                cycle: datasetRow.cycle,
                catalogItems: anomaly.catalogItems,
              })

              datasetRow.adjustmentRequest = adjustmentRequest
              await datasetRow.save()
            }
          }

        }
      } catch (e) {
        console.error('Error recuperando las anomalías', e)
        ctx.throw(500, 'Error recuperando las anomalías')
      }
    }

    try {
      if (bulkOps.length > 0) {
        await Anomaly.bulkWrite(bulkOps)
        const rows = await DataSetRow.insertMany(updateBulk)

        if (data.rol === 'manager-level-1') {
          for (let datasetRow of rows) {
            const adjustmentRequest = await AdjustmentRequest.create({
              organization: datasetRow.organization,
              project: datasetRow.project,
              dataset: datasetRow.dataset,
              datasetRow: datasetRow._id,
              product: datasetRow.product,
              newProduct: datasetRow.newProduct,
              channel: datasetRow.channel,
              salesCenter: datasetRow.salesCenter,
              lastAdjustment: datasetRow.data.adjustment,
              newAdjustment: datasetRow.data.prediction,
              requestedBy: ctx.state.user._id,
              status: 'created',
              catalogItems: datasetRow.catalogItems,
              period: datasetRow.period,
              cycle: datasetRow.cycle
            })

            datasetRow.adjustmentRequest = adjustmentRequest
            await datasetRow.save()
          }
        }
      }
    } catch (e) {
      console.error('Error recuperando las anomalías 2', e)
      ctx.throw(500, 'Error recuperando las anomalías 2')
    }

    ctx.body = {
      data: 'ok'
    }
  }
})
