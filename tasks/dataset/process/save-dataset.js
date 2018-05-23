// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const path = require('path')
const { execSync } = require('child_process')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const processDataset = require('queues/process-dataset')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[save_dataset] ') + args

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
              'lastAdjustment': obj[adjustmentColumn.name] || undefined,
              'productExternalId': obj[productExternalId.name],
              'salesCenterExternalId': obj[salesCenterExternalId.name],
              'channelExternalId': obj[channelExternalId.name]
            }
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

      await sendSlackNotificacion.run({
        channel: 'opskamino',
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
    sendSlackNotificacion.run({
      channel: 'opskamino',
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
    sendSlackNotificacion.run({
      channel: 'opskamino',
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
