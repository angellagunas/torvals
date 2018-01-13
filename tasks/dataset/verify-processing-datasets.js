// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet, Product, SalesCenter } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching procesing Datasets...')

  const datasets = await DataSet.find({
    status: 'processing',
    isDeleted: false
  })

  if (datasets.length === 0) {
    console.log('No processing datasets to verify ...')

    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var dataset of datasets) {
    console.log(`Verifying if ${dataset.name} dataset has finished processing ...`)
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
      console.log(`${dataset.name} dataset has finished processing`)

      var productCol = dataset.columns.find(item => { return item.isProduct })
      var salesCenterCol = dataset.columns.find(item => { return item.isSalesCenter })
      let apiData = {
        products: [],
        salesCenters: []
      }

      if (productCol) {
        productCol = productCol.name
        apiData['products'] = res.data[productCol]
      }

      if (salesCenterCol) {
        salesCenterCol = salesCenterCol.name
        apiData['salesCenters'] = res.data[salesCenterCol]
      }

      dataset.set({
        status: 'reviewing',
        dateMax: res.date_max,
        dateMin: res.date_min,
        apiData: apiData
      })

      await dataset.save()
      await dataset.processData()
    }
  }

  console.log(`Successfully verified ${datasets.length} datasets with status {processing}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
