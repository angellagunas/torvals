// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet, DataSetRow, Channel, Product, SalesCenter, Project } = require('models')
const getAnomalies = require('../anomalies/get-anomalies')

const task = new Task(async function (argv) {
  console.log('Fetching adjustment Datasets...')

  const datasets = await DataSet.find({
    status: 'pendingRows',
    isDeleted: false
  }).populate('createdBy')

  if (datasets.length === 0) {
    console.log('No adjustment datasets to verify ...')

    return true
  }

  for (var dataset of datasets) {
    console.log(`Verifying if ${dataset.externalId} dataset has finished adjustment ...`)

    try {
      var res = await Api.getDataset(dataset.externalId)
    } catch (e) {
      dataset.set({
        error: 'Hubo un problema al obtener el dataset de Abraxas!',
        status: 'error'
      })

      await dataset.save()

      console.log(`Error while obtaining dataset: ${dataset.error}`)
      return false
    }

    if (res.status === 'ready') {
      console.log(`${dataset.externalId} dataset has finished processing`)

      await dataset.processReady(res)

      dataset.set({status: 'receiving'})
      await dataset.save()

      console.log(`Obtaining rows from dataset ...`)

      try {
        var resDataset = await Api.rowsDataset(dataset.externalId)

        var numPages = Math.ceil(resDataset._meta.total / resDataset._meta.max_results)

        var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
        var productExternalId = dataset.getProductColumn() || {name: ''}
        var channelExternalId = dataset.getChannelColumn() || {name: ''}
        var predictionColumn = dataset.getPredictionColumn() || {name: ''}
        var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
        var analysisColumn = dataset.getAnalysisColumn() || {name: ''}
        var dateColumn = dataset.getDateColumn() || {name: ''}

        if (!adjustmentColumn.name) {
          adjustmentColumn = predictionColumn
        }

        if (!adjustmentColumn.name && !predictionColumn.name) {
          adjustmentColumn = analysisColumn
          predictionColumn = analysisColumn
        }

        var i = 1

        do {
          for (var dataRow of resDataset._items) {
            var salesCenter = await SalesCenter.findOne({
              externalId: dataRow[salesCenterExternalId.name],
              organization: dataset.organization
            })
            var product = await Product.findOne({
              externalId: dataRow[productExternalId.name],
              organization: dataset.organization
            })

            var channel = await Channel.findOne({
              externalId: dataRow[channelExternalId.name],
              organization: dataset.organization
            })

            try {
              await DataSetRow.create({
                organization: dataset.organization,
                project: dataset.project,
                dataset: dataset,
                externalId: dataRow._id,
                data: {
                  existence: dataRow.existencia,
                  prediction: dataRow[predictionColumn.name],
                  forecastDate: dataRow[dateColumn.name],
                  semanaBimbo: dataRow.semana_bimbo,
                  adjustment: dataRow[adjustmentColumn.name] || dataRow[predictionColumn.name],
                  localAdjustment: dataRow[adjustmentColumn.name] || dataRow[predictionColumn.name],
                  lastAdjustment: dataRow[adjustmentColumn.name] || undefined
                },
                apiData: dataRow,
                salesCenter: salesCenter,
                product: product,
                channel: channel
              })
            } catch (e) {
              console.log('Hubo un error al tratar de guardar la row: ')
              console.log(dataRow)
            }
          }

          i++
          if (i > numPages) continue
          resDataset = await Api.rowsDataset(dataset.externalId, i)
        } while (i <= numPages)

        dataset.set({
          status: 'adjustment',
          etag: res._etag
        })
        await dataset.save()
      } catch (e) {
        dataset.set({
          error: 'No se pudieron obtener filas del dataset! ' + e.message,
          status: 'error'
        })

        await dataset.save()

        console.log(`Error while obtaining dataset rows: ${dataset.error}`)
        return false
      }

      const project = await Project.findOne({'_id': dataset.project, 'isDeleted': false})

      console.log(`Obtaining anomalies from proyect ...`)
      res = await getAnomalies.run({uuid: project.uuid})

      if (!res) {
        dataset.set({
          error: 'No se pudieron obtener las anomalías!',
          status: 'error'
        })

        await dataset.save()

        console.log(`Error while obtaining dataset rows: ${dataset.error}`)
        return false
      }

      project.set({
        status: 'adjustment'
      })
      await project.save()

      dataset.sendFinishedConciliating()
    }

    if (res.status === 'error') {
      dataset.set({
        error: res.message,
        status: 'error'
      })

      await dataset.save()

      console.log(`Error while obtaining dataset rows: ${dataset.error}`)
      return false
    }
  }

  console.log(`Successfully verified ${datasets.length} datasets with status {adjustment}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
