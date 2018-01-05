// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching preprocessing Datasets...')

  const datasets = await DataSet.find({
    status: 'preprocessing',
    isDeleted: false
  })

  if (datasets.length === 0) {
    console.log('No preprocessing datasets to verify ...')

    return true
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
      json: true,
      persist: true
    }

    var res = await request(options)

    if (res.status === 'done' && res.headers.length > 1) {
      console.log(`${dataset.name} dataset has finished preprocessing`)
      dataset.set({
        status: 'configuring',
        columns: res.headers.map(item => {
          return {
            name: item,
            isDate: false,
            isAnalysis: false,
            isOperationFilter: false,
            isAnalysisFilter: false
          }
        })
      })

      await dataset.save()
    }
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
