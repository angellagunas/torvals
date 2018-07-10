// node tasks/pio/app/create.js --forecast=uuid
require('../../../config')
require('lib/databases/mongo')

const createApp = require('queues/pio-create-app')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-task-app-queue')
  log.call('Start app creation.')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  log.call('Save forecast.')
  forecast.set({
    instanceKey: forecast.uuid,
    port: forecast.port || '8000',
    status: 'initializing'
  })
  await forecast.save()

  log.call('Sending task to queue for the APP creation.')
  createApp.add({
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
