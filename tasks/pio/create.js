// node tasks/pio/app/create.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const Mailer = require('lib/mailer')

const createApp = require('tasks/pio-server/create-app')
const loadAppData = require('tasks/pio-server/load-data')
const engineBuild = require('tasks/pio-server/engine-build')
const engineTrain = require('tasks/pio-server/engine-train')
const engineDeploy = require('tasks/pio-server/engine-deploy')
const createBatch = require('tasks/pio-server/create-batch-prediction-json')

const { Forecast } = require('models')

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

  // log.call('Deploying the engine...')
  await engineDeploy.run({
    forecast: forecast.uuid
  })

  // log.call('Creating json for batch predict')
  // await createBatch.run({
  //   forecast: forecast.uuid
  // })

  log.call('Done! Forecast generated')
  log.call(`End ==>  ${moment().format()}`)

  const email = new Mailer('forecast-ready')
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

  await email.format(dataMail)

  const recipient = {
    email: forecast.forecastGroup.createdBy.email,
    name: forecast.forecastGroup.createdBy.name
  }

  let recipients = {
    recipient: recipient
  }

  await email.send({
    ...recipients,
    title: 'Se ha generado una predicción'
  })

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
