// node tasks/dataset/process/reconfigure-dataset.js --uuid uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { DataSet, DataSetRow, Anomaly } = require('models')
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

    const dataset = await DataSet.findOne({uuid: argv.uuid})
      .populate('uploadedBy')

    var bulkOps = []
    var saveBulk = []

    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    try {
      log('Restoring Anomalies')

      let anomalies = await Anomaly.find({project: dataset.project}).cursor()

      for (let anomaly = await anomalies.next(); anomaly != null; anomaly = await anomalies.next()) {
        console.log(anomaly)
        if (anomaly) {
          bulkOps.push({
            updateOne: {
              'filter': {_id: anomaly._id},
              'update': {$set: {isDeleted: true}}
            }
          })
          saveBulk.push({
            'organization': anomaly.organization,
            'project': anomaly.project,
            'dataset': dataset._id,
            'apiData': anomaly.apiData,
            'product': anomaly.product,
            'newProduct': anomaly.newProduct,
            'cycle': anomaly.cycle,
            'period': anomaly.period,
            'data': {
              ...anomaly.data,
              'prediction': anomaly.prediction,
              'sale': anomaly.data.sale,
              'forecastDate': anomaly.date,
              'adjustment': anomaly.prediction,
              'localAdjustment': anomaly.prediction
            }
          })
        }

        if (bulkOps.length === batchSize) {
          log(`${batchSize} anomalies saved!`)
          await Anomaly.bulkWrite(bulkOps)
          bulkOps = []
          await DataSetRow.insertMany(saveBulk)
          saveBulk = []
        }
      }

      if (bulkOps.length > 0) {
        await Anomaly.bulkWrite(bulkOps)
        await DataSetRow.insertMany(saveBulk)
      }

      log(`Finished restoring Anomalies!`)
      log(`Reprocessing Rows....`)

      let rows = await DataSetRow.find({
        dataset: dataset._id
      }).cursor()

      var predictionColumn = dataset.getPredictionColumn() || {name: ''}
      var adjustmentColumn = dataset.getAdjustmentColumn() || {name: ''}
      var dateColumn = dataset.getDateColumn() || {name: ''}
      var salesColumn = dataset.getSalesColumn() || {name: ''}
      var productExternalId = dataset.getProductColumn() || {name: ''}

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
          let catalogColumns = Object.keys(column).filter(x => column[x] === true && x.startsWith('is_'))
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
                'adjustment': adjustment || prediction,
                'localAdjustment': adjustment || prediction,
                'lastAdjustment': adjustment,
                'productExternalId': row.apiData[productExternalId.name]
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
      message: `El dataset *${dataset.name}* ha empezado a reconfigurarse con las nuevas ` +
      `reglas de negocio`
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
      message: `El dataset *${dataset.name}* ha sido reconfigurado` +
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
