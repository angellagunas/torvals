// node tasks/pio/app/create.js --uuid=uuid
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const fs = require('fs')
const path = require('path')
const sendEmail = require('tasks/emails/send-email')
const replaceAll = require('underscore.string/replaceAll')

const createApp = require('tasks/pio-server/create-app')
const loadAppData = require('tasks/pio-server/load-data')
const engineBuild = require('tasks/pio-server/engine-build')
const engineTrain = require('tasks/pio-server/engine-train')
const engineDeploy = require('tasks/pio-server/engine-deploy')
const createBatch = require('tasks/pio-server/create-batch-prediction-json')
const getBatch = require('tasks/pio-server/get-batch-prediction')
const cleanUp = require('tasks/pio-server/clean-up')

const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const { Catalog, Forecast } = require('models')

let start = async (argv) => {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }
  const forecast = await Forecast.findOne({uuid: argv.uuid})
    .populate('forecastGroup engine')

  if (!forecast) {
    throw new Error('Invalid uuid!')
  }

  let forecastGroup = forecast.forecastGroup
  let engine = forecast.engine

  sendSlackNotificacion.run({
    channel: 'all',
    message: `La predicción *${forecastGroup.alias}* con engine ` +
      `*${engine.name}* ha empezado a generarse!.`
  })
}

let end = async (argv) => {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }
  const forecast = await Forecast.findOne({uuid: argv.uuid})
    .populate('forecastGroup engine')

  if (!forecast) {
    throw new Error('Invalid uuid!')
  }

  let forecastGroup = forecast.forecastGroup
  let engine = forecast.engine

  sendSlackNotificacion.run({
    channel: 'all',
    message: `La predicción *${forecastGroup.alias}* con engine ` +
      `*${engine.name}* ha terminado de generarse y esta lista para revisarse!.`,
    attachment: {
      title: 'Exito!',
      image_url: 'https://i.imgur.com/GfHWtUx.gif'
    }
  })
}

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
    .populate({path: 'project', populate: {path: 'organization'}})
    .populate({path: 'forecastGroup', populate: {path: 'createdBy'}})

  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }
  const catalogs = await Catalog.find({
    _id: { $in: forecast.catalogs },
    isDeleted: false
  })

  const tmpdir = path.resolve('/engines', forecast.engine.path)
  const filePath = path.join(tmpdir, '/engine.json')
  const engineJson = fs.readFileSync(filePath);
  const engine = JSON.parse(engineJson)

  engine.datasource.params.appName = forecast.uuid
  engine.datasource.params.columns = ['date'].concat(catalogs.map((catalog) => replaceAll(catalog.slug, '-', '_')))
  engine.algorithms[0].params.appName = forecast.uuid
  engine.algorithms[0].params.label = 'sale'
  engine.algorithms[0].params.date = 'date'
  engine.algorithms[0].params.groupBy = ['date'].concat(catalogs.map((catalog) => replaceAll(catalog.slug, '-', '_')))

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

  // DEPLOY ENGINE
  log.call('Deploying the engine...')
  let deploy = await engineDeploy.run({
    forecast: forecast.uuid
  })

  // CREATE JSON FOR BATCH PREDICT
  log.call('Creating json for batch predict...')
  await createBatch.run({
    forecast: forecast.uuid
  })

  // SAVE PREDICTIONS
  log.call('Reading and saving predictions...')
  await getBatch.run({
    forecast: forecast.uuid
  })

  forecast.set({
    status: 'ready'
  })
  await forecast.save()

  log.call('Done! Forecast generated')

  let url = process.env.APP_HOST
  let base = url.split('://')
  base[1].replace('wwww', '')
  url = base[0] + '://' + forecast.project.organization.slug + '.' + base[1]

  let dataMail = {
    url: url + '/forecast/detail/' + forecast.forecastGroup.uuid,
    base: url,
    name: forecast.forecastGroup.createdBy.name,
    prediction: forecast.forecastGroup.alias,
    org_logo: forecast.project.organization.profileUrl
  }

  const recipients = {
    email: forecast.forecastGroup.createdBy.email,
    name: forecast.forecastGroup.createdBy.name
  }
  sendEmail.run({
    recipients,
    args: dataMail,
    template: 'forecast-ready',
    title: 'Se ha generado una predicción.'
  })
 
  // CLEAN UP
  log.call('Cleaning up...')
  await cleanUp.run({
    forecast: forecast.uuid,
    deploy: deploy
  })

  log.call(`End ==>  ${moment().format()}`)

  return true
}, start, end)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
