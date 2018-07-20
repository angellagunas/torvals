// node tasks/pio/engine-train.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { spawnSync } = require('child_process')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-engine-traing')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  log.call('Train engine.')
  const spawnPio = spawnSync(
    'pio',
    ['train', '--main-py-file', './train.py'],
    { cwd: `/engines/${forecast.engine.path}` }
  )

  log.call(spawnPio.output)
  log.call(spawnPio.stdout)
  log.call(spawnPio.signal)

  log.call(spawnPio.status)
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
