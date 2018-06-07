// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const ObjectId = require('mongodb').ObjectID
const moment = require('moment')

const Task = require('lib/task')
const { AdjustmentRequest } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching AdjustmentRequests...')

  const filters = {}

  const size = await AdjustmentRequest.find(filters).count()

  if (size === 0) {
    console.log('No AdjustmentRequests to verify ...')
    return true
  }

  const rows = await AdjustmentRequest.find(filters).populate('datasetRow').cursor()
  var bulkOps = []

  for (let row = await rows.next(); row != null; row = await rows.next()) {
    bulkOps.push(
      {
        'updateOne': {
          'filter': { '_id': row._id },
          'update': {
            '$set': {
              'product': row.datasetRow.product,
              'channel': row.datasetRow.channel,
              'salesCenter': row.datasetRow.salesCenter
            }
          }
        }
      }
    )

    if (bulkOps.length === 1000) {
      console.log(`1000 ops ==> ${moment().format()}`)
      await AdjustmentRequest.bulkWrite(bulkOps)
      bulkOps = []
    }
  }

  if (bulkOps.length > 0) await AdjustmentRequest.bulkWrite(bulkOps)
  console.log(`${bulkOps.length} ops ==> ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
