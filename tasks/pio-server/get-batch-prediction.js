// node tasks/pio/get-batch-prediction.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const fs = require('fs')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-get-batch-prediction')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({uuid: argv.forecast})
    .populate('engine')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }

  const tmpdir = path.resolve('.', 'media', 'jsons')
  fs.mkdir(tmpdir, (err) => {
    log.call('Folder already exists')
  })
  const filePath = path.join(tmpdir, `${forecast.uuid}.json`)

  log.call('Import data to created app.')
  for (var i = 0; i < pages; i++) {
    log.call(`${lineCount} => ${(i * batchSize) + 1} - ${(i * batchSize) + batchSize}`)

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

      let prediction = obj[predictionColumn.name] || '0'
      if (prediction === 'NA') prediction = 0

      try {
        prediction = parseInt(prediction)
      } catch (e) {
        log.call('Error!')
        log.call(e)

        continue
      }

      let catalogData = {}
      for (let column of dataset.columns) {
        let catalogColumns = Object.keys(column).filter(x => column[x] === true && x.startsWith('is_'))

        for (let catalogColumnName of catalogColumns) {
          catalogData[catalogColumnName] = obj[column.name]
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
          'adjustment': prediction,
        },
        'catalogData': catalogData
      })
    }

    await DataSetRow.insertMany(bulkOps)
    bulkOps = []
    log.call(`${batchSize} ops ==> ${moment().format()}`)
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
