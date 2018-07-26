// node tasks/pio/load-data.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const Logger = require('lib/utils/logger')
const request = require('lib/request')
const moment = require('moment')
const Task = require('lib/task')
const replaceAll = require('underscore.string/replaceAll')
const { CatalogItem, DataSetRow, Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-load-data')

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
    dataset: forecast.project.mainDataset
  }).populate('newProduct').cursor()

  const catalogItems = await CatalogItem.find({
    organization: forecast.project.organization
  }).populate('catalog')

  log.call('Load data.')
  let count = 0
  let err = 0
  for (let row = await rows.next(); row != null; row = await rows.next()) {
    let group = 'group_date_sale'
    let properties = {
      date: moment.utc(row.data.forecastDate).format('YYYY-MM-DD'),
      sale: row.data.sale,
      product_id: row.newProduct.externalId,
    }
    for (let cat of row.catalogItems) {
      const info = catalogItems.find((element) => {
        return String(element._id) === String(cat)
      })

      group = group + '_' + replaceAll(info.catalog.slug, '-', '_')
      properties[`${replaceAll(info.catalog.slug, '-', '_')}_id`] = info.externalId
    }
    // Validate if the length of the properties are consistent in each request.
    if(Object.keys(properties).length !== forecast.catalogs.length + 2) {
      err = err + 1
      continue
    }

    const options = {
      url: `http://pio:7070/events.json?accessKey=${forecast.instanceKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        'event': group,
        'entityType': 'user',
        'entityId': row._id,
        'properties': properties
      },
      json: true,
      persist: true
    }
    count = count + 1
    try {
      const res = await request(options)
    } catch (e) {
      console.log(e)
      log.call('There was an error creating the event.')
    }
  }

  log.call(`${count} events loaded.`)
  log.call(`${err} rows with issues.`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
