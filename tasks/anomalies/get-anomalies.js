// node tasks/anomalies/get-anomalies.js --uuid uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { Anomaly, DataSetRow, DataSet } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }
  console.log('Fetching Anomalies ...')

  const dataset = await DataSet.findOne({uuid: argv.uuid})
  if (!dataset) {
    throw new Error('Project not found')
  }

  var batchSize = 10000
  const datasetrows = await DataSetRow.find({
    dataset: dataset._id,
    'data.prediction': {$ne: null},
    $or: [{'data.prediction': 0}, {'data.prediction': {$lt: 0}}] })

  var bulkOps = []
  var updateBulk = []
  for (let dataRow of datasetrows) {
    try {
      bulkOps.push({
        datasetRow: dataRow._id,
        salesCenter: dataRow.salesCenter,
        product: dataRow.product,
        channel: dataRow.channel,
        project: dataset.project,
        prediction: dataRow.data.prediction,
        semanaBimbo: dataRow.data.semanaBimbo,
        organization: dataset.organization,
        type: 'zero_sales',
        date: dataRow.data.forecastDate
      })
      updateBulk.push({
        updateOne: {
          'filter': {_id: dataRow._id},
          'update': {$set: {isAnomaly: true}}
        }
      })

      if (bulkOps.length === batchSize) {
        console.log(`${batchSize} anomalies saved!`)
        await Anomaly.insertMany(bulkOps)
        bulkOps = []
        await DataSetRow.bulkWrite(updateBulk)
        updateBulk = []
      }
    } catch (e) {
      console.log('Error trying to save anomaly: ')
      console.log(e)
    }
  }

  try {
    if (bulkOps.length > 0) {
      await Anomaly.insertMany(bulkOps)
      await DataSetRow.bulkWrite(updateBulk)
    }
  } catch (e) {
    console.log('Error trying to save anomaly: ')
    console.log(e)
  }
  dataset.set({ status: 'reviewing' })
  await dataset.save()
  console.log(`Received ${datasetrows.length} anomalies!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
