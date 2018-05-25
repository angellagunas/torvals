// node tasks/anomalies/get-anomalies.js --uuid uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { Anomaly, DataSetRow, DataSet, Project } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }
  console.log('Fetching Anomalies ...')

  const project = await Project.findOne({uuid: argv.uuid}).populate('mainDataset activeDataset')

  if (!project) {
    throw new Error('Project not found')
  }

  var batchSize = 10000
  const datasetrows = await DataSetRow.find({
    dataset: project.activeDataset._id,
    'data.prediction': {$ne: null},
    $or: [{'data.prediction': 0}, {'data.prediction': {$lt: 0}}] })

  var bulkOps = []
  var updateBulk = []
  for (let dataRow of datasetrows) {
    try {
      bulkOps.push({
        dataset: project.activeDataset._id,
        datasetRow: dataRow._id,
        salesCenter: dataRow.salesCenter,
        product: dataRow.product,
        channel: dataRow.channel,
        project: project._id,
        prediction: dataRow.data.prediction,
        semanaBimbo: dataRow.data.semanaBimbo,
        organization: project.organization,
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

  console.log(`Received ${datasetrows.length} anomalies!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
