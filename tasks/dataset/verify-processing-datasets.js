// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')
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

      let apiData = {
        products: [],
        salesCenters: [],
        channels: []
      }

      apiData['products'] = res.data['product']
      apiData['salesCenters'] = res.data['agency']
      apiData['channels'] = res.data['channel']

      dataset.set({
        status: 'reviewing',
        dateMax: res.date_max,
        dateMin: res.date_min,
        apiData: apiData
      })

      await dataset.save()
      await dataset.processData()
    }

    if (res.status === 'error') {
      dataset.set({
        error: res.message,
        status: 'error'
      })

      await dataset.save()

      console.log(`Error while processing dataset: ${dataset.error}`)
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
