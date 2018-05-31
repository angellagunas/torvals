// node tasks/anomalies/get-anomalies.js --uuid uuid [--batchSize batchize]
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Anomaly, DataSetRow, Project } = require('models')
const sendSlackNotification = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[get-anomalies] ') + args

      console.log(args)
    }

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    var batchSize = 10000
    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log('Invalid batch size!')
      }
    }

    log('Finding Anomalies ...')
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({uuid: argv.uuid}).populate('mainDataset activeDataset')

    if (!project) {
      throw new Error('Project not found')
    }

    const datasetrows = await DataSetRow.find({
      dataset: project.activeDataset._id,
      'data.prediction': {$ne: null},
      $or: [{'data.prediction': 0}, {'data.prediction': {$lt: 0}}]
    }).cursor()

    log('Rows ready, transversing ...')

    var bulkOps = []
    var updateBulk = []
    let count = 0
    for (let dataRow = await datasetrows.next(); dataRow != null; dataRow = await datasetrows.next()) {
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
          log(`${batchSize} anomalies saved! => ${moment().format()}`)
          await Anomaly.insertMany(bulkOps)
          bulkOps = []
          await DataSetRow.bulkWrite(updateBulk)
          updateBulk = []
        }
        count++
      } catch (e) {
        log('Error trying to save anomalies: ')
        log(e)
      }
    }

    try {
      if (bulkOps.length > 0) {
        await Anomaly.insertMany(bulkOps)
        await DataSetRow.bulkWrite(updateBulk)
      }
    } catch (e) {
      log('Error trying to save anomalies: ')
      log(e)
    }

    log(`Received ${count} anomalies!`)

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide a project!')
    }

    const project = await Project.findOne({uuid: argv.uuid})

    if (!project) {
      throw new Error('Invalid project!')
    }

    sendSlackNotification.run({
      channel: 'all',
      message: `Se estan obteniendo las anomalias del proyecto *${project.name}*`
    })
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide a project!')
    }

    const project = await Project.findOne({uuid: argv.uuid})

    if (!project) {
      throw new Error('Invalid project!')
    }

    sendSlackNotification.run({
      channel: 'all',
      message: `Se obtuvieron correctamente todas las anomalias del proyecto *${project.name}*!`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
