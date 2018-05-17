// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const fs = require('fs')
const _ = require('lodash')
const { execSync } = require('child_process')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching Dataset...')

  var today = new Date()
  var timestamp = today.getTime()

  const output = fs.createWriteStream(
    './tasks/logs/process-dataset-' + timestamp + '.txt'
  )
  const error = fs.createWriteStream(
    './tasks/logs/error-process-dataset-' + timestamp + '.txt'
  )

  const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('fileChunk')
  var bulkOps = []

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

  let rows = await DataSetRow.aggregate(statement)
  let rowData = {
    product: [],
    agency: [],
    channel: []
  }

  for (let product of rows[0].products) {
    let productIndex = _.findIndex(rowData['product'], { '_id': product._id })
    if (productIndex === -1) {
      rowData['product'].push(product)
    } else {
      if (!rowData['product'][productIndex].name && product.name) {
        rowData['product'][productIndex].name = product.name
      }
    }
  }

  for (let salesCenter of rows[0].salesCenters) {
    let salesIndex = _.findIndex(rowData['agency'], { '_id': salesCenter._id })
    if (salesIndex === -1) {
      rowData['agency'].push(salesCenter)
    } else {
      if (!rowData['agency'][salesIndex].name && salesCenter.name) {
        rowData['agency'][salesIndex].name = salesCenter.name
      }
    }
  }

  for (let channel of rows[0].channels) {
    let channelIndex = _.findIndex(rowData['channel'], { '_id': channel._id })
    if (channelIndex === -1) {
      rowData['channel'].push(channel)
    } else {
      if (!rowData['channel'][channelIndex].name && channel.name) {
        rowData['channel'][channelIndex].name = channel.name
      }
    }
  }

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
  maxDate = rows[0].max
  minDate = rows[0].min

  const sendData = {
    data: rowData,
    date_max: moment(maxDate).format('YYYY-MM-DD'),
    date_min: moment(minDate).format('YYYY-MM-DD'),
    config: {
      groupings: []
    }
  }
  dataset.processReady(sendData)

  console.log('Success! Dataset processed')

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
