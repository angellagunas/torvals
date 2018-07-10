// node tasks/pio/create-app.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { spawn } = require('child_process')
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
  const ls = spawn(
    'pio',
    ['app', 'new', forecast.engine.name, '--access-key', forecast.instanceKey],
    { cdw: forecast.engine.path }
  );

  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ls.on('close', (code) => {
    // Code 0 for OK
    console.log(`child process exited with code ${code}`);
  });

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
