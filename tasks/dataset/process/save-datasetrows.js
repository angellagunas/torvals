// node tasks/dataset/process/save-datasetrows.js --uuid uuid
require('../../../config')
require('lib/databases/mongo')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const getAnomalies = require('queues/get-anomalies')
const Task = require('lib/task')
const { DataSetRow, DataSet } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('save-datasetrows')
    const batchSize = 5
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    log.call('Saving products/sales centers/channels from catalog ...')
    log.call(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.uuid})
    .populate('newProducts cycles periods catalogItems project')

    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    log.call('Saving products ...')
    let bulkOps = []
    for (let product of dataset.newProducts) {
      bulkOps.push({
        updateMany: {
          'filter': {
            dataset: dataset._id,
            'data.productExternalId': product.externalId
          },
          'update': {$set: {newProduct: product._id}}
        }
      })

      if (bulkOps.length === batchSize) {
        console.log(`${batchSize} products saved!`)
        await DataSetRow.bulkWrite(bulkOps)
        bulkOps = []
      }
    }

    if (bulkOps.length > 0) {
      await DataSetRow.bulkWrite(bulkOps)
    }
    log.call('Products successfully saved!')

    bulkOps = []

    log.call('Saving catalog items ...')
    for (let catalogItems of dataset.catalogItems) {
      if (catalogItems.type === 'producto') continue

      const filters = {dataset: dataset._id}
      filters['catalogData.is_' + catalogItems.type + '_id'] = catalogItems.externalId.toString()

      bulkOps.push({
        updateMany: {
          'filter': filters,
          'update': {
            $push: {
              catalogItems: catalogItems._id
            }
          }
        }
      })

      if (bulkOps.length === batchSize) {
        console.log(`${batchSize} catalog items saved!`)
        await DataSetRow.bulkWrite(bulkOps)
        bulkOps = []
      }
    }
    if (bulkOps.length > 0) {
      await DataSetRow.bulkWrite(bulkOps)
    }
    log.call('Catalog items successfully saved!')

    bulkOps = []

    log.call('Saving cycles and periods...')
    if (dataset.periods) {
      for (let period of dataset.periods) {
        bulkOps.push({
          updateMany: {
            'filter': {
              dataset: dataset._id,
              'data.forecastDate': {
                $gte: moment(period.dateStart).utc().format('YYYY-MM-DD'),
                $lte: moment(period.dateEnd).utc().format('YYYY-MM-DD')
              }
            },
            'update': {$set: {
              period: period._id,
              cycle: period.cycle
            }}
          }
        })

        if (bulkOps.length === batchSize) {
          console.log(`${batchSize} cycles and periods items saved!`)
          await DataSetRow.bulkWrite(bulkOps)
          bulkOps = []
        }
      }
    }

    if (bulkOps.length > 0) {
      await DataSetRow.bulkWrite(bulkOps)
    }

    log.call('Cycles and periods successfully saved!')

    dataset.set({ status: 'reviewing' })

    if (dataset.isMain && dataset.project.status === 'pending-configuration') {
      dataset.set({ status: 'ready' })
      dataset.project.set({ status: 'pendingRows' })
      await dataset.project.save()
      getAnomalies.add({uuid: dataset.project.uuid})
    }

    await dataset.save()

    log.call('Success! DatasetRows processed!')
    log.call(`End ==>  ${moment().format()}`)

    return true
  },
  async (argv) => {
    if (argv.noSlack) return
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
    if (argv.noSlack) return
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
