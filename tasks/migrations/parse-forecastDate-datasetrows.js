// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const ObjectId = require('mongodb').ObjectID
const moment = require('moment')

const Task = require('lib/task')
const { DataSetRow } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching DatasetsRows...')

  const filters = {dataset: ObjectId('5ae7a6bc1f25560012c29f20')}
  const pageSize = 5000

  const size = await DataSetRow.find(filters).count()
  const pages = Math.ceil(size / pageSize)

  if (size === 0) {
    console.log('No datasetRows to verify ...')
    return true
  }

  for (var i = 1; i <= pages; i++) {
    console.log(`Modifying page ${i} of ${pages}`)
    let datasetRows = await DataSetRow.find(filters).skip((i - 1) * pageSize).limit(pageSize)
    for (var row of datasetRows) {
      let data = row.data
      data.forecastDate = moment.utc(row.apiData.fecha, 'YYYY-MM-DD')

      row.set({data: data})
      await row.save()
    }
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
