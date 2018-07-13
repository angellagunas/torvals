// node tasks/pio/app/create.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const createApp = require('queues/pio-create-app')
const loadAppData = require('queues/pio-load-data')
const engineBuild = require('queues/pio-build-engine')
const engineTrain = require('queues/pio-train-engine')
const engineDeploy = require('queues/pio-deploy-engine')
const createBatch = require('queues/pio-create-json')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-task-app-queue')
  log.call('Start app creation.')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
    .populate('forecastGroup')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  // CREATE
  /*log.call('Update forecast data.')
  forecast.set({
    instanceKey: forecast.uuid,
    port: forecast.port || '8000',
    status: 'initializing'
  })
  await forecast.save()

  log.call('Sending task to queue for the APP creation.')
  createApp.add({
    forecast: forecast.uuid
  })*/

  // LOAD
  /*log.call('Sending task to queue for loading APP data.')
  loadAppData.add({
    forecast: forecast.uuid
  })*/

  // BUILD ENGINE
  /*log.call('Sending task to queue for building the engine.')
  engineBuild.add({
    forecast: forecast.uuid
  })*/

  // TRAIN ENGINE
  /*log.call('Sending task to queue for trainging the engine.')
  engineTrain.add({
    forecast: forecast.uuid
  })*/

  // DEPLOY ENGINE
  /*log.call('Sending task to queue for trainging the engine.')
  engineDeploy.add({
    forecast: forecast.uuid
  })*/

  // CFREATE BATCH
  log.call('Sending task to queue for creating the json.')
  createBatch.add({
    forecast: forecast.uuid
  })

  log.call('Forecast/App task sended.')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
