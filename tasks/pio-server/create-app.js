// node tasks/pio/create-app.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const slugify = require('underscore.string/slugify')
const Task = require('lib/task')
const { spawnSync } = require('child_process')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-create-app')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  log.call('Create new app.')
  const spawnPio = spawnSync(
    'pio',
    ['app', 'new', slugify(forecast.engine.name), '--access-key', forecast.instanceKey],
    { cwd: `/engines/${forecast.engine.path}` }
  )

  log.call(spawnPio.output)
  log.call(spawnPio.stdout)
  log.call(spawnPio.signal)

  log.call(spawnPio.status)
  if (spawnPio.status !== 0) {
    log.call(spawnPio.stderr)
    log.call(spawnPio.error)
    forecast.set({
      status: 'error'
    })
    await forecast.save()

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
