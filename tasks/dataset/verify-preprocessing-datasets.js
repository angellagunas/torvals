// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')
const request = require('request-promise-native')

const task = new Task(async function (argv) {
  console.log('Fetching preprocessing Datasets...')

  const datasets = await DataSet.find({status: 'preprocessing'})

  if (datasets.length === 0) {
    console.log('No preprocessing datasets to verify ...')
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var dataset of datasets) {
    console.log(`Verifying if ${dataset.name} dataset has finished preprocessing ...`)
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/datasets/${dataset.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true
    }

    console.log(options)

    var res = await request(options)
    console.log(res)

    // if (res.status === 'done') {
    //   dataset.set({
    //     status: 'configuring',
    //     columns: res.columns
    //   })

    //   await dataset.save()
    // }
  }

  console.log(`Successfully verified ${datasets.length} datasets with status {preprocessing}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
