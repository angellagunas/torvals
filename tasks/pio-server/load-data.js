// node tasks/pio/load-data.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { spawn } = require('child_process')
const { DatasetRow, Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-load-data')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
    .populate('forecastGroup')
    .populate('forecastGroup project')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  log.call('Import data to created app.')
  const rows = await DatasetRow.find({
    dataset: forecast.forecastGroup.project.dataset,
    cycle: { '$in': forecast.forecastGroup.cycles }
  })

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
