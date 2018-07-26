// node tasks/pio/create-app.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const slugify = require('underscore.string/slugify')
const Task = require('lib/task')
const path = require('path')
const { spawnSync } = require('child_process')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-create-app')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  if (!argv.deploy) {
    throw new Error('No app to stop')
  }

  log.call('Stopping deploy...')

  argv.deploy.kill()

  log.call('Clean up JSON')
  const tmpdir = path.resolve('.', 'media', 'jsons')
  const filePath = path.join(tmpdir, `${forecast.uuid}.json`)
  const outputFilePath = path.join(tmpdir, `${forecast.uuid}-output.json`)

  await spawnSync(
    'rm',
    ['-rf', filePath]
  )

  await spawnSync(
    'rm',
    ['-rf', outputFilePath]
  )

  log.call('Clean up PIO app')

  const spawnPio = await spawnSync(
    'pio',
    ['app', 'delete', slugify(forecast.uuid), '-f'],
    { cwd: `/engines/${forecast.engine.path}` }
  )

  log.call(spawnPio.stdout)
  log.call(spawnPio.signal)

  log.call(spawnPio.status)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
