// node tasks/pio/get-batch-prediction.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')
const path = require('path')
const { execSync } = require('child_process')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const saveDatasetrows = require('tasks/dataset/process/save-datasetrows')
const { Forecast, Rule, DataSetRow } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('pio-get-batch-prediction')
  const batchSize = 10000

  log.call(`Start ==>  ${moment().format()}`)

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine project dataset')
  if (!forecast) {
    throw new Error('Invalid forecast.')
  }

  const tmpdir = path.resolve('.', 'media', 'jsons')
  const filePath = path.join(tmpdir, `${forecast.uuid}-output.json`)
  let contents = String(execSync(`ls ${filePath}`)).split('\n')
  let dataset = forecast.dataset

  const rule = await Rule.findOne({_id: forecast.project.rule}).populate('catalogs')

  const catalogs = rule.catalogs
  let bulkOps = []

  log.call('Reading prediction data from file.')
  for (let file of contents) {
    if (!file.includes('part-')) continue

    log.call(`Reading file ${file}...`)
    let actualFilePath = path.join(filePath, file)
    const rawLineCount = execSync(`wc -l < ${actualFilePath}`)
    log.call('Line count ===> ', parseInt(String(rawLineCount)))

    const lineCount = parseInt(String(rawLineCount))
    const pages = Math.ceil(lineCount / batchSize)

    for (var i = 0; i < pages; i++) {
      log.call(`${lineCount} => ${(i * batchSize) + 1} - ${(i * batchSize) + batchSize}`)

      let rawLine

      if (i === 0) {
        rawLine = String(execSync(`sed '1d;${(i * batchSize) + batchSize}q' ${actualFilePath}`))
      } else {
        rawLine = String(execSync(`sed '1,${i * batchSize}d;${(i * batchSize) + batchSize}q' ${actualFilePath}`))
      }

      let rows = rawLine.split('\n')
      for (let row of rows) {
        if (row === '') continue
        try {
          row = JSON.parse(row)
        } catch (e) {
          console.log(e)
          console.log(row)
          continue
        }

        let obj = row.query
        if (!obj['fecha']) {
          continue
        }

        let forecastDate

        try {
          forecastDate = moment.utc(obj['fecha'], 'YYYY-MM-DD')
        } catch (e) {
          continue
        }

        if (!forecastDate.isValid()) {
          continue
        }

        let prediction = row.prediction.label || '0'
        if (prediction === 'NA') prediction = 0

        try {
          prediction = parseInt(prediction)
        } catch (e) {
          log.call('Error!')
          log.call(e)

          continue
        }

        let catalogData = {}
        for (let cat of catalogs) {
          if (cat.slug === 'producto') continue
          if (cat.slug === 'centro-de-venta') {
            catalogData[`is_${cat.slug}_id`] = obj[`agencia_id`]
          } else {
            catalogData[`is_${cat.slug}_id`] = obj[`${cat.slug}_id`]
          }
        }

        bulkOps.push({
          'organization': dataset.organization,
          'project': dataset.project,
          'dataset': dataset._id,
          'apiData': obj,
          'data': {
            'prediction': prediction,
            'forecastDate': forecastDate,
            'sale': 0,
            'adjustment': prediction,
            'localAdjustment': prediction,
            'lastAdjustment': undefined,
            'productExternalId': obj[`producto_id`]
          },
          'catalogData': catalogData
        })
      }

      await DataSetRow.insertMany(bulkOps)
      bulkOps = []
      log.call(`${batchSize} ops ==> ${moment().format()}`)
    }
  }

  log.call('Obtaining max and min dates ...')
  let statement = [
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

  let rows = await DataSetRow.aggregate(statement)

  let maxDate = moment(rows[0].max).utc().format('YYYY-MM-DD')
  let minDate = moment(rows[0].min).utc().format('YYYY-MM-DD')
  dataset.set({
    dateMin: minDate,
    dateMax: maxDate
  })
  await dataset.save()

  await saveDatasetrows.run({uuid: dataset.uuid, noSlack: true})

  log.call(`End ==>  ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
