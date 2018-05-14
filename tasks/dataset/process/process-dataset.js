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

  await DataSetRow.deleteMany({dataset: dataset._id})

  console.log(dataset.fileChunk)
  const filepath = `${dataset.fileChunk.path}/${dataset.fileChunk.filename}`

  const rawLineCount = execSync(`wc -l < ${filepath}`)
  console.log('line count ===> ', parseInt(String(rawLineCount)))
  const lineCount = Math.ceil((parseInt(String(rawLineCount)) - 1) / 1000)

  console.log('Reading =>', lineCount * 100, 'from', filepath)

  var headers = String(execSync(`sed -n '1p' ${filepath}`))
  headers = headers.split('\n')[0].split(',')

  var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
  var productExternalId = dataset.getProductColumn() || {name: ''}
  var channelExternalId = dataset.getChannelColumn() || {name: ''}
  var predictionColumn = dataset.getPredictionColumn() || {name: ''}
  var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
  var analysisColumn = dataset.getAnalysisColumn() || {name: ''}
  var dateColumn = dataset.getDateColumn() || {name: ''}
  var salesColumn = dataset.getSalesColumn() || {name: ''}

  let maxDate
  let minDate
  let productsObj = {}
  let salesCentersObj = {}
  let channelsObj = {}

  console.log(headers)

  for (var i = 0; i < lineCount; i++) {
    console.log('=>', (i * 1000) + 1, (i * 1000) + 1000)
    let rawLine = String(execSync(`sed -n '${i * 1000 + 1},${(i * 1000) + 1000}p' ${filepath}`))

    let rows = rawLine.split('\n')

    for (let row of rows) {
      let obj = {}
      let itemSplit = row.split(',')

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = itemSplit[j]
      }

      if (!obj[dateColumn.name]) {
        continue
      }

      let forecastDate

      try {
        forecastDate = moment.utc(obj[dateColumn.name], 'YYYY-MM-DD')
      } catch (e) {
        continue
      }

      if (!forecastDate.isValid()) {
        continue
      }

      // productsObj[obj[productExternalId.name] =

      bulkOps.push({
        'organization': dataset.organization,
        'project': dataset.project,
        'dataset': dataset._id,
        'apiData': obj,
        'data': {
          'existence': obj.existencia,
          'prediction': obj[predictionColumn.name],
          'sale': obj[salesColumn.name] ? obj[salesColumn.name] : 0,
          'forecastDate': forecastDate,
          'semanaBimbo': obj.semana_bimbo,
          'adjustment': obj[adjustmentColumn.name] || obj[predictionColumn.name],
          'localAdjustment': obj[adjustmentColumn.name] || obj[predictionColumn.name],
          'lastAdjustment': obj[adjustmentColumn.name] || undefined
        }
      })
    }

    // bulkOps = rows.map(item => {
    //   let obj = {}
    //   let itemSplit = item.split(',')

    //   for (var i = 0; i < headers.length; i++) {
    //     obj[headers[i]] = itemSplit[i]
    //   }

    //   if (!obj[dateColumn.name]) {
    //     return undefined
    //   }

    //   let forecastDate

    //   try {
    //     forecastDate = moment.utc(obj[dateColumn.name], 'YYYY-MM-DD')
    //   } catch (e) {
    //     return undefined
    //   }

    //   if (!forecastDate.isValid()) {
    //     return undefined
    //   }

    //   // productsObj[obj[productExternalId.name] =

    //   return {
    //     'organization': dataset.organization,
    //     'project': dataset.project,
    //     'dataset': dataset._id,
    //     'apiData': obj,
    //     'data': {
    //       'existence': obj.existencia,
    //       'prediction': obj[predictionColumn.name],
    //       'sale': obj[salesColumn.name] ? obj[salesColumn.name] : 0,
    //       'forecastDate': forecastDate,
    //       'semanaBimbo': obj.semana_bimbo,
    //       'adjustment': obj[adjustmentColumn.name] || obj[predictionColumn.name],
    //       'localAdjustment': obj[adjustmentColumn.name] || obj[predictionColumn.name],
    //       'lastAdjustment': obj[adjustmentColumn.name] || undefined
    //     }
    //   }
    // })

    // bulkOps = bulkOps.filter(item => { return !!item })

    await DataSetRow.insertMany(bulkOps)
    bulkOps = []
    console.log(`1000 ops ==> ${moment().format()}`)
  }

  // for (let row = await rows.next(); row != null; row = await rows.next()) {
  //   try {
  //     console.log('Searching for week...')
  //     var abraxasdate = _.find(abraxasdates, (date) => {
  //       return moment(date.dateStart).diff(moment(row.data.forecastDate), 'minutes') === 0 || moment(date.dateEnd).diff(moment(row.data.forecastDate), 'minutes') === 0
  //     })
  //     console.log('abraxasdate', abraxasdate)
  //     if (abraxasdate) {
  //       console.log('Date found!')
  //       console.log('DataSetRow ' + row.uuid)
  //       console.log('Date ' + row.data.forecastDate)
  //       console.log('Week ' + abraxasdate.week)

  //       output.write('Date found! ')
  //       output.write('DataSetRow ' + row.uuid)
  //       output.write(' Date ' + row.data.forecastDate)
  //       output.write(' Week ' + abraxasdate.week + ' \n')

  //       bulkOps.push(
  //         {
  //           'updateOne': {
  //             'filter': { '_id': row._id },
  //             'update': { '$set': { 'data.semanaBimbo': abraxasdate.week } }
  //           }
  //         }
  //       )
  //     } else {
  //       console.log('Date not found!!')
  //       console.log('DataSetRow ' + row.uuid)
  //       console.log('Date ' + row.data.forecastDate)

  //       output.write('Date not found!! ')
  //       output.write('DataSetRow ' + row.uuid)
  //       output.write(' Date ' + row.data.forecastDate + ' \n')
  //     }

  //     if (bulkOps.length === 1000) {
  //       console.log(`1000 ops ==> ${moment().format()}`)
  //       await DataSetRow.bulkWrite(bulkOps)
  //       bulkOps = []
  //       output.write(` \n 1000 ops ==> ${moment().format()} \n`)
  //     }
  //   } catch (e) {
  //     console.log('Error!!')
  //     console.log(e)
  //     error.write('Error!! \n')
  //     error.write(e)
  //     return false
  //   }
  // }

  // try {
  //   if (bulkOps.length > 0) await DataSetRow.bulkWrite(bulkOps)
  //   console.log(`Data saved ==> ${moment().format()}`)
  //   output.write(`Data saved ==> ${moment().format()}`)
  // } catch (e) {
  //   console.log('Error!!')
  //   console.log(e)
  //   error.write('Error!! \n')
  //   error.write(e)
  //   return false
  // }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
