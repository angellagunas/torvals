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
    // cycle: { '$in': forecast.cycles }
  }).populate('newProduct').cursor()

  const catalogItems = await CatalogItem.find({
    organization: forecast.project.organization
  }).populate('catalog')

  log.call('Load data.')
  for (let row = await rows.next(); row != null; row = await rows.next()) {
    let group = 'group_fecha_producto'
    let properties = {
      fecha: moment.utc(row.data.forecastDate).format('YYYY-MM-DD'),
      producto_id: row.newProduct.externalId,
      venta_uni: row.data.sale
    }
    for (let cat of row.catalogItems) {
      const info = catalogItems.find((element) => {
        return String(element._id) === String(cat)
      })

      group = group + '_' + info.catalog.slug
      if (info.catalog.slug === 'centro-de-venta') {
        properties['agencia_id'] = info.externalId
      } else {
        properties[`${info.catalog.slug}_id`] = info.externalId
      }
    }

    const options = {
      url: `http://localhost:7070/events.json?accessKey=${forecast.instanceKey}`,
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

    try {
      const res = await request(options)
      // log.call(res)
    } catch (e) {
      console.log(e)
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
