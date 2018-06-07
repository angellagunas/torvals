// node tasks/dataset/process/save-dataset.js --uuid uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const path = require('path')
const { execSync } = require('child_process')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')
const sendSlackNotification = require('tasks/slack/send-message-to-channel')
const processDataset = require('queues/process-dataset')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[save-dataset] ') + args

      console.log(args)
    }

    var batchSize = 10000
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log('Invalid batch size!')
      }
    }

    log(`Fetching Dataset ${argv.uuid} ...`)
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('fileChunk').populate('uploadedBy')
    var bulkOps = []

    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    try {
      await DataSetRow.deleteMany({dataset: dataset._id})

      let fileChunk = dataset.fileChunk
      const filepath = path.join(fileChunk.path, fileChunk.filename)

      const rawLineCount = execSync(`wc -l < ${filepath}`)
      log('Line count ===> ', parseInt(String(rawLineCount)))

      const lineCount = parseInt(String(rawLineCount)) - 1
      const pages = Math.ceil(lineCount / batchSize)

      var headers = String(execSync(`sed -n '1p' ${filepath}`))
      headers = headers.split('\n')[0].split(',')

      var predictionColumn = dataset.getPredictionColumn() || {name: ''}
      var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
      var dateColumn = dataset.getDateColumn() || {name: ''}
      var salesColumn = dataset.getSalesColumn() || {name: ''}
      var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
      var productExternalId = dataset.getProductColumn() || {name: ''}
      var channelExternalId = dataset.getChannelColumn() || {name: ''}

      for (var i = 0; i < pages; i++) {
        log(`${lineCount} => ${(i * batchSize) + 1} - ${(i * batchSize) + batchSize}`)

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

          let adjustment = obj[adjustmentColumn.name] || '0'
          let prediction = obj[predictionColumn.name] || '0'

          if (adjustment === 'NA') adjustment = 0
          if (prediction === 'NA') prediction = 0

          try {
            adjustment = parseInt(adjustment)
            prediction = parseInt(prediction)
          } catch (e) {
            console.log('Error!')
            console.log(e)

            continue
          }

          let catalogData = {}
          for (let column of dataset.columns) {
            catalogColumns = Object.keys(column).filter(x => column[x] === true && x.startsWith("is_"))
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
              'sale': obj[salesColumn.name] ? obj[salesColumn.name] : 0,
              'forecastDate': forecastDate,
              'semanaBimbo': obj.semana_bimbo,
              'adjustment': adjustment || prediction,
              'localAdjustment': adjustment || prediction,
              'lastAdjustment': adjustment || undefined,
              'productExternalId': obj[productExternalId.name],
              'salesCenterExternalId': obj[salesCenterExternalId.name],
              'channelExternalId': obj[channelExternalId.name]
            },
            'catalogData': catalogData
          })
        }

        await DataSetRow.insertMany(bulkOps)
        bulkOps = []
        log(`${batchSize} ops ==> ${moment().format()}`)
      }

      log(`Success! loaded ${lineCount} rows`)
    } catch (e) {
      log('Error! ' + e.message)
      dataset.set({
        status: 'error',
        error: e.message
      })
      await dataset.save()

      await sendSlackNotification.run({
        channel: 'all',
        message: `Error al cargar el dataset *${dataset.name}* a la base de datos! ` +
        `*${e.message}*`
      })

      return false
    }

    log(`End ==> ${moment().format()}`)

    if (!argv.noNextStep) processDataset.add({uuid: dataset.uuid})

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('uploadedBy')
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }
    sendSlackNotification.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha empezado a guardarse en base de datos.` +
      ` Fue cargado por *${dataset.uploadedBy.name}*`
    })
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('uploadedBy')
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }
    sendSlackNotification.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha sido cargado a la base de datos` +
      ` y se procederá a procesarse.`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
