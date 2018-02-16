// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet, DataSetRow, Channel, Product, SalesCenter, Project } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching adjustment Datasets...')

  const datasets = await DataSet.find({
    status: 'pendingRows',
    isDeleted: false
  })

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

      for (var d of resDataset._items) {
        var salesCenter = await SalesCenter.findOne({
          externalId: d.agencia_id,
          organization: dataset.organization
        })
        var product = await Product.findOne({
          externalId: d.producto_id,
          organization: dataset.organization
        })

        var channel = await Channel.findOne({
          externalId: d.canal_id,
          organization: dataset.organization
        })

        await DataSetRow.create({
          organization: dataset.organization,
          project: dataset.project,
          dataset: dataset,
          externalId: d._id,
          data: {
            existence: d.existencia,
            prediction: d.prediccion,
            forecastDate: d.fecha,
            semanaBimbo: d.semana_bimbo,
            adjustment: d.prediccion
          },
          apiData: d,
          salesCenter: salesCenter,
          product: product,
          channel: channel
        })
      }

      dataset.set({
        status: 'adjustment',
        etag: res._etag
      })
      await dataset.save()

      const project = await Project.findOne({'_id': dataset.project, 'isDeleted': false})
      project.set({
        status: 'adjustment'
      })
      await project.save()
    }

    if (res.status === 'error') {
      dataset.set({
        error: res.message,
        status: 'error'
      })

      await dataset.save()

      console.log(`Error while obtaining dataset rows: ${dataset.error}`)
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
