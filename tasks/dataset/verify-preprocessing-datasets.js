// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')

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

  for (var dataset of datasets) {
    console.log(`Verifying if ${dataset.name} dataset has finished preprocessing ...`)
    try {
      var res = await Api.getDataset(dataset.externalId)

      if (res.status === 'done' && res.headers.length > 1) {
        console.log(`${dataset.name} dataset has finished preprocessing`)
        dataset.set({
          status: 'configuring',
          etag: res._etag,
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

      if (res.status === 'error') {
        dataset.set({
          error: res.message,
          status: 'error'
        })

        await dataset.save()

        console.log(`Error while preprocessing dataset: ${dataset.error}`)
      }
    } catch (e) {
      dataset.set({
        error: e,
        status: 'error'
      })

      await dataset.save()

      console.log(`Error while preprocessing dataset: ${dataset.error}`)
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
