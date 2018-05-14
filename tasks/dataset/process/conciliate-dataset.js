// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')

const task = new Task(async function (argv) {
  if (!argv.dataset1) {
    throw new Error('You need to provide an uuid!')
  }

  if (!argv.dataset2) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching Datasets...')

  const dataset1 = await DataSet.findOne({uuid: argv.dataset1})
  const dataset2 = await DataSet.findOne({uuid: argv.dataset2})
  var bulkOps = []

  if (!dataset1 || !dataset2) {
    throw new Error('Invalid uuid!')
  }

  var predictionColumn = {name: 'prediccion'}
  var adjustmentColumn = {name: 'ajuste'}
  var dateColumn = {name: 'fecha'}
  var salesColumn = {name: 'venta'}
  var salesCenterExternalId = {name: 'agencia_id'}
  var productExternalId = {name: 'producto_id'}
  var channelExternalId = {name: 'canal_id'}

  const rows = await DataSetRow.find({dataset: dataset1._id}).cursor()
  var bulkOps = []
  for (let row = await rows.next(); row != null; row = await rows.next()) {
    let secondRow = await DataSetRow.find({
      'apiData.agencia_id': row.apiData.agencia_id,
      'apiData.fecha': row.apiData.fecha,
      'apiData.producto_id': row.apiData.producto_id,
      'apiData.canal_id': row.apiData.canal_id,
      'dataset': dataset2._id
    })

    // bulkOps.push(
    //   {
    //     'updateOne': {
    //       'filter': { '_id': row._id },
    //       'update': { '$set': { 'data.forecastDate': newDate } }
    //     }
    //   }
    // )

    // if (bulkOps.length === 1000) {
    //   console.log(`1000 ops ==> ${moment().format()}`)
    //   await DataSetRow.bulkWrite(bulkOps)
    //   bulkOps = []
    // }
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
