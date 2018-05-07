// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const ObjectId = require('mongodb').ObjectID
const moment = require('moment')

const Task = require('lib/task')
const { DataSetRow } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching DatasetsRows...')

  const filters = {}

  const size = await DataSetRow.find(filters).count()

  if (size === 0) {
    console.log('No datasetRows to verify ...')
    return true
  }

  const rows = await DataSetRow.find(filters).cursor()
  var bulkOps = []

  for (let row = await rows.next(); row != null; row = await rows.next()) {
    var newDate = moment.utc(row.apiData.fecha, 'YYYY-MM-DD')

    bulkOps.push(
      {
        'updateOne': {
          'filter': { '_id': row._id },
          'update': { '$set': { 'data.forecastDate': newDate } }
        }
      }
    )

    if (bulkOps.length === 1000) {
      console.log(`1000 ops ==> ${moment().format()}`)
      await DataSetRow.bulkWrite(bulkOps)
      bulkOps = []
    }
  }

  if (bulkOps.length > 0) await DataSetRow.bulkWrite(bulkOps)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
