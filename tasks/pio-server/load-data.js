// node tasks/pio/load-data.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const request = require('lib/request')
const Task = require('lib/task')
const { CatalogItem, DataSetRow, Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-load-data')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
    .populate('project')
    .populate('forecastGroup')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }
  await forecast.forecastGroup.populate('project').execPopulate()

  log.call('Import data to created app.')
  const rows = await DataSetRow.find({
    dataset: forecast.project.mainDataset,
    cycle: { '$in': forecast.forecastGroup.cycles }
  })

  const catalogItems = await CatalogItem.find({
    organization: forecast.project.organization
  }).populate('catalog')

  log.call('Load data.')
  for (let row of rows) {
    const data = row.catalogItems.reduce(function (obj, item) {
      const info = catalogItems.find(function (element) {
        return element._id === item
      })
      log.call(info)
      obj[info.catalog.slug] = info.name

      return obj
    }, {})

    const options = {
      url: `http://localhost:7070/events.json?accessKey=${forecast.instanceKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        'event': 'group',
        'entityType': 'forecast',
        'entityId': '',
        'properties': {
          ...data
        }
      },
      json: true,
      persist: true
    }
    console.log(data)

    try {
      const res = await request(options)
      log.call(res)
    } catch (e) {
      log.call('There was an error creating the event.')
    }
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
