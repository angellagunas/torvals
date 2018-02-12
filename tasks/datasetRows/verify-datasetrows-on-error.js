// node tasks/datasetsRows/verify-datasetrows-on-error.js
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSetRow } = require('models')
const verifyDatasetrows = require('queues/update-datasetrows')

const task = new Task(async function (argv) {
  console.log('Fetching DatasetsRows...')

  const datasetRows = await DataSetRow.find({
    status: 'error'
  }).populate('dataset')

  if (datasetRows.length === 0) {
    console.log('No datasetRows to verify ...')
    return true
  }

  for (var datasetRow of datasetRows) {
    datasetRow.set({status: 'sendingChanges'})
    await datasetRow.save()
    verifyDatasetrows.add({uuid: datasetRow.uuid})
  }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
