// node tasks/dataset/process/reconfigure-dataset.js --uuid uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')
const sendSlackNotification = require('tasks/slack/send-message-to-channel')
const processDataset = require('queues/process-dataset')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[reconfigure-dataset] ') + args

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
      let rows = await DataSetRow.find({
        dataset: dataset._id
      }).cursor()

      var predictionColumn = dataset.getPredictionColumn() || {name: ''}
      var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
      var dateColumn = dataset.getDateColumn() || {name: ''}
      var salesColumn = dataset.getSalesColumn() || {name: ''}
      var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
      var productExternalId = dataset.getProductColumn() || {name: ''}
      var channelExternalId = dataset.getChannelColumn() || {name: ''}

      for (let row = await rows.next(); row != null; row = await rows.next()) {
        let forecastDate

        try {
          forecastDate = moment.utc(row.apiData[dateColumn.name], 'YYYY-MM-DD')
        } catch (e) {
          continue
        }

        if (!forecastDate.isValid()) {
          continue
        }

        let adjustment = row.apiData[adjustmentColumn.name] || '0'
        let prediction = row.apiData[predictionColumn.name] || '0'

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
          catalogColumns = Object.keys(column).filter(x => column[x] === true && x.startsWith('is_'))
          for (let catalogColumnName of catalogColumns) {
            catalogData[catalogColumnName] = row.apiData[column.name]
          }
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: row._id },
            update: {
              'data': {
                'prediction': prediction,
                'sale': row.apiData[salesColumn.name] ? row.apiData[salesColumn.name] : 0,
                'forecastDate': forecastDate,
                'semanaBimbo': row.apiData.semana_bimbo,
                'adjustment': adjustment || prediction,
                'localAdjustment': adjustment || prediction,
                'lastAdjustment': adjustment,
                'productExternalId': row.apiData[productExternalId.name],
                'salesCenterExternalId': row.apiData[salesCenterExternalId.name],
                'channelExternalId': row.apiData[channelExternalId.name]
              },
              'catalogData': catalogData,
              'catalogItems': []
            }
          }
        })

        if (bulkOps.length === batchSize) {
          await DataSetRow.bulkWrite(bulkOps)
          bulkOps = []
          log(`${batchSize} ops ==> ${moment().format()}`)
        }
      }

      log(`Success!`)
    } catch (e) {
      log('Error! ' + e.message)
      dataset.set({
        status: 'error',
        error: e.message
      })
      await dataset.save()

      await sendSlackNotification.run({
        channel: 'all',
        message: `Error al reconfigurar el dataset *${dataset.name}*! ` +
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
