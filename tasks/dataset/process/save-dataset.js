// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const path = require('path')
const { execSync } = require('child_process')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')

const task = new Task(async function (argv) {
  var batchSize = 10000
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  if (argv.batchSize) {
    try {
      batchSize = parseInt(argv.batchSize)
    } catch (e) {
      console.log('Invalid batch size!')
    }
  }

  console.log(`Fetching Dataset ${argv.uuid} ...`)
  console.log(`Using batch size of ${batchSize}`)
  console.log(`Start ==>  ${moment().format()}`)

  const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('fileChunk')
  var bulkOps = []

  if (!dataset) {
    throw new Error('Invalid uuid!')
  }

  await DataSetRow.deleteMany({dataset: dataset._id})

  let fileChunk = dataset.fileChunk
  const filepath = path.join(fileChunk.path, fileChunk.filename)

  const rawLineCount = execSync(`wc -l < ${filepath}`)
  console.log('Line count ===> ', parseInt(String(rawLineCount)))

  const lineCount = parseInt(String(rawLineCount)) - 1
  const pages = Math.ceil(lineCount / batchSize)

  var headers = String(execSync(`sed -n '1p' ${filepath}`))
  headers = headers.split('\n')[0].split(',')

  var predictionColumn = dataset.getPredictionColumn() || {name: ''}
  var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
  var dateColumn = dataset.getDateColumn() || {name: ''}
  var salesColumn = dataset.getSalesColumn() || {name: ''}

  for (var i = 0; i < pages; i++) {
    console.log(`${lineCount} => ${(i * batchSize) + 1} - ${(i * batchSize) + batchSize}`)

    let rawLine

    if (i === 0) {
      rawLine = String(execSync(`sed '1d;${(i * batchSize) + batchSize}q' ${filepath}`))
    } else {
      rawLine = String(execSync(`sed '1,${i * batchSize}d;${(i * batchSize) + batchSize}q' ${filepath}`))
    }

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
    console.log(`${batchSize} ops ==> ${moment().format()}`)
  }

  console.log(`Success! loaded ${lineCount} rows`)
  dataset.set({
    status: 'reviewing'
  })

  await dataset.save()

  console.log(`End ==> ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
