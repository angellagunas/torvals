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

  console.log(productsObj)

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
  // let rows = await DataSetRow.distinct(productsStr, {dataset: dataset})
  console.log(JSON.stringify(rows))

  // for (var i = 0; i < lineCount; i++) {
  //   console.log('=>', (i * 1000) + 1, (i * 1000) + 1000)
  //   let rawLine = String(execSync(`sed -n '${i * 1000 + 1},${(i * 1000) + 1000}p' ${filepath}`))

  //   let rows = rawLine.split('\n')

  //   for (let row of rows) {
  //     let obj = {}
  //     let itemSplit = row.split(',')

  //     for (var j = 0; j < headers.length; j++) {
  //       obj[headers[j]] = itemSplit[j]
  //     }

  //     if (!obj[dateColumn.name]) {
  //       continue
  //     }

  //     let forecastDate

  //     try {
  //       forecastDate = moment.utc(obj[dateColumn.name], 'YYYY-MM-DD')
  //     } catch (e) {
  //       continue
  //     }

  //     if (!forecastDate.isValid()) {
  //       continue
  //     }

  //     bulkOps.push({
  //       'organization': dataset.organization,
  //       'project': dataset.project,
  //       'dataset': dataset._id,
  //       'apiData': obj,
  //       'data': {
  //         'existence': obj.existencia,
  //         'prediction': obj[predictionColumn.name],
  //         'sale': obj[salesColumn.name] ? obj[salesColumn.name] : 0,
  //         'forecastDate': forecastDate,
  //         'semanaBimbo': obj.semana_bimbo,
  //         'adjustment': obj[adjustmentColumn.name] || obj[predictionColumn.name],
  //         'localAdjustment': obj[adjustmentColumn.name] || obj[predictionColumn.name],
  //         'lastAdjustment': obj[adjustmentColumn.name] || undefined
  //       }
  //     })
  //   }

  //   await DataSetRow.insertMany(bulkOps)
  //   bulkOps = []
  //   console.log(`1000 ops ==> ${moment().format()}`)
  // }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
