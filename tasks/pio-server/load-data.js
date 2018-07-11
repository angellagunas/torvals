// node tasks/pio/load-data.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { spawnSync } = require('child_process')
const { DataSetRow, Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-load-data')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
    .populate('forecastGroup')
    .populate('forecastGroup.project')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }
  await forecast.forecastGroup.populate('project').execPopulate()

  log.call('Import data to created app.')
  const rows = await DataSetRow.find({
    dataset: forecast.forecastGroup.project.dataset,
    cycle: { '$in': forecast.forecastGroup.cycles }
  })

  log.call('Load data.')
  const spawnPio = spawnSync(
    'python',
    ['/data/import_data.py', '--access-key', forecast.instanceKey, '--file', '/data/sample_data_barcel.csv', '--group-by', 'fecha producto_id'],
    { cwd: `/engines/${forecast.engine.path}` }
  )

  if (spawnPio.status !== 0) {
    log.call(spawnPio.stderr)
    log.call(spawnPio.error)
    return false
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
