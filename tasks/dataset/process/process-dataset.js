// node tasks/dataset/process/process-dataset.js --uuid uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { DataSet, DataSetRow, Cycle } = require('models')
const saveDatasetRows = require('queues/save-datasetrows')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[process-dataset] ') + args

      console.log(args)
    }

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    log('Processing Dataset...')
    log(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('organization')

    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
    var salesCenterName = dataset.getSalesCenterNameColumn() || {name: ''}
    var productExternalId = dataset.getProductColumn() || {name: ''}
    var productName = dataset.getProductNameColumn() || {name: ''}
    var channelExternalId = dataset.getChannelColumn() || {name: ''}
    var channelName = dataset.getChannelNameColumn() || {name: ''}

    let maxDate
    let minDate

    let productsObj = {
      _id: `$apiData.${productExternalId.name}`
    }

    if (productName.name) {
      productsObj['name'] = `$apiData.${productName.name}`
    }

    let salesCentersObj = {
      _id: `$apiData.${salesCenterExternalId.name}`
    }

    if (salesCenterName.name) {
      salesCentersObj['name'] = `$apiData.${salesCenterName.name}`
    }

    let channelsObj = {
      _id: `$apiData.${channelExternalId.name}`
    }

    if (channelName.name) {
      channelsObj['name'] = `$apiData.${channelName.name}`
    }

    var statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      },
      {
        '$group': {
          '_id': null,
          'channels': {
            '$addToSet': channelsObj
          },
          'salesCenters': {
            '$addToSet': salesCentersObj
          },
          'products': {
            '$addToSet': productsObj
          }
        }
      }
    ]

    log('Obtaining uniques ...')

    let rows = await DataSetRow.aggregate(statement)
    let rowData = {
      products: [],
      salesCenters: [],
      channels: []
    }

    for (let product of rows[0].products) {
      let productIndex = _.findIndex(rowData['products'], { '_id': product._id })
      if (productIndex === -1) {
        rowData['products'].push(product)
      } else {
        if (!rowData['products'][productIndex].name && product.name) {
          rowData['products'][productIndex].name = product.name
        }
      }
    }

    for (let salesCenter of rows[0].salesCenters) {
      let salesIndex = _.findIndex(rowData['salesCenters'], { '_id': salesCenter._id })
      if (salesIndex === -1) {
        rowData['salesCenters'].push(salesCenter)
      } else {
        if (!rowData['salesCenters'][salesIndex].name && salesCenter.name) {
          rowData['salesCenters'][salesIndex].name = salesCenter.name
        }
      }
    }

    for (let channel of rows[0].channels) {
      let channelIndex = _.findIndex(rowData['channels'], { '_id': channel._id })
      if (channelIndex === -1) {
        rowData['channels'].push(channel)
      } else {
        if (!rowData['channels'][channelIndex].name && channel.name) {
          rowData['channels'][channelIndex].name = channel.name
        }
      }
    }

    for (let catalog of dataset.organization.rules.catalogs) {
      rowData[catalog] = []

      if (catalog === 'Producto') {
        rowData[catalog] = rowData.product.map(item => { return item })
      }

      if (catalog === 'Centro de venta') {
        rowData[catalog] = rowData.agency.map(item => { return item })
      }

      if (catalog === 'Canal') {
        rowData[catalog] = rowData.channel.map(item => { return item })
      }
    }

    log('Obtaining max and min dates ...')

    statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      },
      {
        '$group': {
          '_id': null,
          'max': { '$max': '$data.forecastDate' },
          'min': { '$min': '$data.forecastDate' }
        }
      }
    ]

    rows = await DataSetRow.aggregate(statement)
    maxDate = moment(rows[0].max).utc().format('YYYY-MM-DD')
    minDate = moment(rows[0].min).utc().format('YYYY-MM-DD')

    log('Obtaining cycles  ...')

    var cycles = await Cycle.find({
      organization: dataset.organization._id,
      isDeleted: false,
      dateStart: {$gte: minDate, $lte: maxDate}
    })

    cycles = cycles.map(item => {
      return item._id
    })

    const sendData = {
      data: rowData,
      date_max: maxDate,
      date_min: minDate,
      config: {
        groupings: []
      },
      cycles: cycles
    }

    log('Obtaining new products/sales centers/channels  ...')

    try {
      await dataset.processReady(sendData)
    } catch (e) {
      console.log(e)

      return false
    }

    log('Success! Dataset processed')
    log(`End ==>  ${moment().format()}`)

    if (!argv.noNextStep) saveDatasetRows.add({uuid: dataset.uuid})

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
      message: `El dataset *${dataset.name}* ha empezado a procesarse.`
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
      message: `El dataset *${dataset.name}* ha terminado de procesarse.`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
