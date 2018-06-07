// node tasks/dataset/process/process-dataset.js --uuid uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const _ = require('lodash')
const fillCyclesPeriods = require('tasks/organization/fill-cycles-periods')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const slugify = require('underscore.string/slugify')
const saveDatasetRows = require('queues/save-datasetrows')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { DataSet, DataSetRow, Cycle, Period } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('process-dataset')

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    log.call('Processing Dataset...')
    log.call(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('organization')
    const organization = dataset.organization

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
    let catalogsObj = {}

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

    for (let catalog of organization.rules.catalogs) {
      name = dataset.getCatalogItemColumn(`is_${catalog}_name`)
      idStr = dataset.getCatalogItemColumn(`is_${catalog}_id`)

      catalogObj = {
        _id: `$apiData.${idStr.name}`
      }

      if (name && name.name) {
        catalogObj['name'] = `$apiData.${name.name}`
      }

      catalogsObj[catalog] = {
        '$addToSet': catalogObj
      }
    }

    var statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      }, {
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
          },
          ...catalogsObj
        }
      }
    ]

    log.call('Obtaining uniques ...')

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

    for (let catalog of organization.rules.catalogs) {
      rowData[catalog] = rows[0][catalog]
    }

    log.call('Obtaining max and min dates ...')
    statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      }, {
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

    await fillCyclesPeriods.run({
      uuid: dataset.organization.uuid,
      dateMin: minDate,
      dateMax: maxDate
    })

    log.call('Obtaining cycles ...')
    let cycles = await Cycle.getBetweenDates(dataset.organization._id, minDate, maxDate)

    cycles = cycles.map(item => {
      return item._id
    })

    log.call('Obtaining periods...')
    let periods = await Period.getBetweenDates(dataset.organization._id, minDate, maxDate)

    periods = periods.map(item => {
      return item._id
    })

    const sendData = {
      data: rowData,
      date_max: maxDate,
      date_min: minDate,
      config: {
        groupings: []
      },
      cycles: cycles,
      periods: periods
    }

    log.call('Obtaining new products/sales centers/channels  ...')

    try {
      await dataset.processReady(sendData)
    } catch (e) {
      console.log(e)

      return false
    }

    log.call('Success! Dataset processed')
    log.call(`End ==>  ${moment().format()}`)

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
      channel: 'all',
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
      channel: 'all',
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
