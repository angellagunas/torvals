// node tasks/pio/engine-deploy.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { spawn } = require('child_process')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-engine-deploy')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  log.call('Deploy engine.')
  const spawnPio = spawn(
    'pio',
    ['deploy', '--port', forecast.port],
    {
      cwd: `/engines/${forecast.engine.path}`,
      stdio: 'ignore', // piping all stdio to /dev/null
      detached: true
    }
  )

  // log.call(spawnPio.output)
  log.call(spawnPio.stdout)
  log.call(spawnPio.signal)

  log.call(spawnPio.status)
  // if (spawnPio.status !== 0) {
  //   log.call(spawnPio.stderr)
  //   log.call(spawnPio.error)
  //   return false
  // }

  // console.log(spawnPio)
  // console.log(spawnPio.kill())

  return spawnPio
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
