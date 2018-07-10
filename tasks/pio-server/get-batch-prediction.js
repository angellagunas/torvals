// node tasks/pio/get-batch-prediction.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { spawn } = require('child_process')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-get-batch-prediction')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  log.call('Import data to created app.')

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
