// node tasks/dataset/process/save-datasetrows.js --uuid uuid
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { DataSetRow, DataSet } = require('models')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[save-datasetrows] ') + args

      console.log(args)
    }

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    log('Saving products/sales centers/channels from catalog ...')
    log(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('channels products salesCenters newChannels newProducts newSalesCenters')
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    log('Saving channels ...')
    for (let channel of dataset.channels) {
      await DataSetRow.update({dataset: dataset._id, 'data.channelExternalId': channel.externalId}, {channel: channel._id}, {multi: true})
    }
    log('Channels successfully saved!')

    log('Saving products ...')
    for (let product of dataset.products) {
      await DataSetRow.update({dataset: dataset._id, 'data.productExternalId': product.externalId}, {product: product._id}, {multi: true})
    }
    log('Products successfully saved!')

    log('Saving sales centers ...')
    for (let salesCenter of dataset.salesCenters) {
      await DataSetRow.update({dataset: dataset._id, 'data.salesCenterExternalId': salesCenter.externalId}, {salesCenter: salesCenter._id}, {multi: true})
    }
    log('Sales Centers successfully saved!')

    log('Saving cycles...')
    if (!dataset.cycles == null) {
      for (let cycle of dataset.cycles) {
        await DataSetRow.update({dataset: dataset._id, 'data.forecastDate': { $gte: cycle.dateStart, $lte: cycle.dateEnd}}, {cycle: cycle._id}, {multi: true})
      }
    }
    log('Cycles successfully saved!')

    log('Saving periods...')
    if (!dataset.periods == null) {
      for (let period of dataset.periods) {
        await DataSetRow.update({dataset: dataset._id, 'data.forecastDate': { $gte: period.dateStart, $lte: period.dateEnd}}, {period: period._id}, {multi: true})
      }
    }
    log('Periods successfully saved!')

    dataset.set({ status: 'reviewing' })
    await dataset.save()

    log('Success! DatasetRows processed!')
    log(`End ==>  ${moment().format()}`)

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
