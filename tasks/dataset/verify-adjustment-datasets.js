// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet, DataSetRow, Channel, Product, SalesCenter, Project } = require('models')
const request = require('lib/request')
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

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var dataset of datasets) {
    console.log(`Verifying if ${dataset.externalId} dataset has finished adjustment ...`)
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/datasets/${dataset.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true,
      persist: true
    }

    var res = await request(options)

    if (res.status === 'ready') {
      console.log(`${dataset.externalId} dataset has finished processing`)

      await dataset.processReady(res)

      options = {
        url: `${apiData.hostname}${apiData.baseUrl}/rows/datasets/${dataset.externalId}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiData.token}`
        },
        json: true,
        persist: true
      }

      console.log(`Obtaining rows from dataset ...`)
      var resDataset = await request(options)
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

      dataset.set({
        status: 'adjustment',
        etag: res._etag
      })
      await dataset.save()

      const project = await Project.findOne({'_id': dataset.project, 'isDeleted': false})

      console.log(`Obtaining anomalies from proyect ...`)
      res = await getAnomalies.add({uuid: project.uuid})

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
