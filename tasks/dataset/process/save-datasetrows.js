// node tasks/dataset/process/save-datasetrows.js --uuid uuid
require('../../../config')
require('lib/databases/mongo')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { DataSetRow, DataSet } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('save-datasetrows')

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    log.call('Saving products/sales centers/channels from catalog ...')
    log.call(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.uuid})
    .populate('channels products salesCenters cycles periods catalogItems')
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    log.call('Saving channels ...')
    for (let channel of dataset.channels) {
      await DataSetRow.update({
        dataset: dataset._id,
        'data.channelExternalId': channel.externalId
      }, {
        channel: channel._id
      }, {
        multi: true
      })
    }
    log.call('Channels successfully saved!')

    log.call('Saving products ...')
    for (let product of dataset.products) {
      await DataSetRow.update({
        dataset: dataset._id,
        'data.productExternalId': product.externalId
      }, {
        product: product._id
      }, {
        multi: true
      })
    }
    log.call('Products successfully saved!')

    log.call('Saving sales centers ...')
    for (let salesCenter of dataset.salesCenters) {
      await DataSetRow.update({
        dataset: dataset._id,
        'data.salesCenterExternalId': salesCenter.externalId
      }, {
        salesCenter: salesCenter._id
      }, {
        multi: true
      })
    }
    log.call('Sales centers successfully saved!')

    log.call('Saving catalog items ...')
    for (let cItem of dataset.catalogItems) {
      await DataSetRow.update({
        dataset: dataset._id,
        [`catalogData.is_${cItem.type}_id`]: String(cItem.externalId)
      }, {
        $push: {
          catalogItems: cItem._id
        }
      }, {
        multi: true
      })
    }
    log.call('Catalog items successfully saved!')

    log.call('Saving cycles and periods...')
    if (dataset.periods) {
      for (let period of dataset.periods) {
        await DataSetRow.update({
          dataset: dataset._id,
          'data.forecastDate': {
            $gte: moment(period.dateStart).utc().format('YYYY-MM-DD'),
            $lte: moment(period.dateEnd).utc().format('YYYY-MM-DD')
          }
        }, {
          period: period._id,
          cycle: period.cycle
        }, {
          multi: true
        })
      }
    }
    log.call('Cycles and periods successfully saved!')

    dataset.set({ status: 'reviewing' })
    await dataset.save()

    log.call('Success! DatasetRows processed!')
    log.call(`End ==>  ${moment().format()}`)

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const dataset = await DataSet.findOne({uuid: argv.uuid})
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }
    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha empezado a asignarsele los productos/centros de venta/canales.`
    })
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const dataset = await DataSet.findOne({uuid: argv.uuid})
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }
    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha terminado de asignarsele los ` +
        `productos/centros de venta/canales y esta listo para conciliarse!.`,
      attachment: {
        title: 'Exito!',
        image_url: 'https://i.imgur.com/GfHWtUx.gif'
      }
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
