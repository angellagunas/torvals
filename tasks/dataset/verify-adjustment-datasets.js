// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const moment = require('moment')
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
        var salesColumn = dataset.getSalesColumn() || {name: ''}

        if (!adjustmentColumn.name) {
          adjustmentColumn = predictionColumn
        }

        if (!adjustmentColumn.name && !predictionColumn.name) {
          adjustmentColumn = analysisColumn
          predictionColumn = analysisColumn
        }


        let products = await Product.find({organization: dataset.organization})
        let salesCenters = await SalesCenter.find({organization: dataset.organization})
        let channels = await Channel.find({organization: dataset.organization})

        let productsObj = {}
        let salesCentersObj = {}
        let channelsObj = {}

        let bulkOps = []

        for (let prod of products) {
          productsObj[prod.externalId] = prod._id
        }

        for (let sc of salesCenters) {
          salesCentersObj[sc.externalId] = sc._id
        }

        for (let chan of channels) {
          channelsObj[chan.externalId] = chan._id
        }

        delete products
        delete salesCenters
        delete channels

        var i = 1

        do {
          console.log(`Receiving page ${i} of ${numPages}`)
          for (var dataRow of resDataset._items) {
            let salesCenter = dataRow[salesCenterExternalId.name]
            let product = dataRow[productExternalId.name]
            let channel = dataRow[channelExternalId.name]

            bulkOps.push({
              organization: dataset.organization,
              project: dataset.project,
              dataset: dataset,
              externalId: dataRow._id,
              data: {
                existence: dataRow.existencia,
                prediction: dataRow[predictionColumn.name],
                sale: dataRow[salesColumn.name] ? dataRow[salesColumn.name] : 0,
                forecastDate: moment.utc(dataRow[dateColumn.name], 'YYYY-MM-DD'),
                semanaBimbo: dataRow.semana_bimbo,
                adjustment: dataRow[adjustmentColumn.name] || dataRow[predictionColumn.name],
                localAdjustment: dataRow[adjustmentColumn.name] || dataRow[predictionColumn.name],
                lastAdjustment: dataRow[adjustmentColumn.name] || undefined
              },
              apiData: dataRow,
              salesCenter: salesCentersObj[salesCenter],
              product: productsObj[product],
              channel: channelsObj[channel]
            })
          }

          try {
            await DataSetRow.insertMany(bulkOps)
          } catch (e) {
            console.log('Hubo un error al tratar de guardar las rows: ')
            console.log(e.message)
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
