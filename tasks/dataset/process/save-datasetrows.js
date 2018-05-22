// node tasks/dataset/process/save-datasetrows.js
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

    var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
    var productExternalId = dataset.getProductColumn() || {name: ''}
    var channelExternalId = dataset.getChannelColumn() || {name: ''}

    log('Saving channels ...')
    for (let channel of dataset.channels) {
      let channelColumn = 'apiData.' + channelExternalId.name
      await DataSetRow.update({dataset: dataset._id, [channelColumn]: channel.externalId}, {channel: channel._id}, {multi: true})
    }

    for (let channel of dataset.newChannels) {
      let channelColumn = 'apiData.' + channelExternalId.name
      await DataSetRow.update({dataset: dataset._id, [channelColumn]: channel.externalId}, {channel: channel._id}, {multi: true})
    }
    log('Channels successfully saved!')

    log('Saving products ...')
    for (let product of dataset.products) {
      let productColumn = 'apiData.' + productExternalId.name
      await DataSetRow.update({dataset: dataset._id, [productColumn]: product.externalId}, {product: product._id}, {multi: true})
    }

    for (let product of dataset.newProducts) {
      let productColumn = 'apiData.' + productExternalId.name
      await DataSetRow.update({dataset: dataset._id, [productColumn]: product.externalId}, {product: product._id}, {multi: true})
    }
    log('Products successfully saved!')

    log('Saving sales centers ...')
    for (let salesCenter of dataset.salesCenters) {
      let salesCenterColumn = 'apiData.' + salesCenterExternalId.name
      await DataSetRow.update({dataset: dataset._id, [salesCenterColumn]: salesCenter.externalId}, {salesCenter: salesCenter._id}, {multi: true})
    }

    for (let salesCenter of dataset.newSalesCenters) {
      let salesCenterColumn = 'apiData.' + salesCenterExternalId.name
      await DataSetRow.update({dataset: dataset._id, [salesCenterColumn]: salesCenter.externalId}, {salesCenter: salesCenter._id}, {multi: true})
    }
    log('Sales Centers successfully saved!')

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
      channel: 'opskamino',
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
      channel: 'opskamino',
      message: `El dataset *${dataset.name}* ha terminado de asignarsele los ` +
        `productos/centros de venta/canales y esta listo para ser conciliado.`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
