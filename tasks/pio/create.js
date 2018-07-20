// node tasks/pio/app/create.js --uuid=uuid
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const fs = require('fs')
const path = require('path')

const createApp = require('tasks/pio-server/create-app')
const loadAppData = require('tasks/pio-server/load-data')
const engineBuild = require('tasks/pio-server/engine-build')
const engineTrain = require('tasks/pio-server/engine-train')
const engineDeploy = require('tasks/pio-server/engine-deploy')
const createBatch = require('tasks/pio-server/create-batch-prediction-json')
const getBatch = require('tasks/pio-server/get-batch-prediction')

const { Catalog, Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-master-queue')
  log.call('Starting forecast proccess...')
  log.call(`Start ==>  ${moment().format()}`)

  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.uuid})
    .populate('engine')
    .populate('forecastGroup')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }
  const catalogs = await Catalog.find({
    _id: { $in: forecast.catalogs },
    isDeleted: false
  })

  const tmpdir = path.resolve('.', 'pio-code', 'engines', forecast.engine.path)
  const filePath = path.join(tmpdir, '/engine.json')
  const engineJson = fs.readFileSync(filePath);
  const engine = JSON.parse(engineJson)

  engine.algorithms[0].params.appName = forecast.uuid
  engine.algorithms[0].params.label = 'venta_uni'
  engine.algorithms[0].params.date = 'fecha'
  engine.algorithms[0].params.groupBy = ['date'].concat(catalogs.map((catalog) => catalog.slug))

  fs.writeFileSync(filePath, JSON.stringify(engine))
  // CREATE
  log.call('Update forecast data.')
  forecast.set({
    instanceKey: forecast.uuid,
    port: forecast.port || '8000',
    status: 'initializing'
  })
  await forecast.save()

  log.call('Creating app...')
  await createApp.run({
    forecast: forecast.uuid
  })

  // LOAD
  log.call('Loading app data ...')
  await loadAppData.run({
    forecast: forecast.uuid
  })

  // BUILD ENGINE
  log.call('Building the engine...')
  await engineBuild.run({
    forecast: forecast.uuid
  })

  // TRAIN ENGINE
  log.call('Training the engine...')
  await engineTrain.run({
    forecast: forecast.uuid
  })

  log.call('Deploying the engine...')
  await engineDeploy.run({
    forecast: forecast.uuid
  })

  log.call('Creating json for batch predict...')
  await createBatch.run({
    forecast: forecast.uuid
  })

  log.call('Reading and saving predictions...')
  await getBatch.run({
    forecast: forecast.uuid
  })

  log.call('Done! Forecast generated')
  log.call(`End ==>  ${moment().format()}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
