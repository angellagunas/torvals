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

  var predictionColumn = dataset.getPredictionColumn() || {name: ''}
  var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
  var dateColumn = dataset.getDateColumn() || {name: ''}
  var salesColumn = dataset.getSalesColumn() || {name: ''}

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

    await DataSetRow.insertMany(bulkOps)
    bulkOps = []
    console.log(`1000 ops ==> ${moment().format()}`)
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
