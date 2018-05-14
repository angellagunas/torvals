// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')
const batchSize = 10000

const task = new Task(async function (argv) {
  if (!argv.dataset1) {
    throw new Error('You need to provide an uuid!')
  }

  if (!argv.dataset2) {
    throw new Error('You need to provide an uuid!')
  }

  let i = 0
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
  var bulkOpsEdit = []
  var bulkOpsNew = []
  for (let row = await rows.next(); row != null; row = await rows.next()) {
    let secondRow = await DataSetRow.findOne({
      'apiData.agencia_id': row.apiData.agencia_id,
      'apiData.fecha': row.apiData.fecha,
      'apiData.producto_id': row.apiData.producto_id,
      'apiData.canal_id': row.apiData.canal_id,
      'dataset': dataset2._id
    })

    if (secondRow) {
      bulkOpsEdit.push(
        {
          'updateOne': {
            'filter': { '_id': row._id },
            'update': { '$set': { 'apiData': secondRow.apiData } }
          }
        }
      )
    } else {
      bulkOpsNew.push(
        {
          'organization': dataset1.organization,
          'project': dataset1.project,
          'dataset': dataset1._id,
          'apiData': secondRow.apiData
        }
      )
    }

    if (bulkOpsEdit.length === batchSize) {
      console.log(`${i} => ${batchSize} ops edit => ${moment().format()}`)
      await DataSetRow.bulkWrite(bulkOpsEdit)
      bulkOpsEdit = []
      i++
    }

    if (bulkOpsNew.length === batchSize) {
      console.log(`${i} => ${batchSize} ops new => ${moment().format()}`)
      await DataSetRow.insertMany(bulkOpsNew)
      bulkOpsNew = []
      i++
    }
  }

  if (bulkOpsEdit.length > 0) {
    await DataSetRow.bulkWrite(bulkOpsEdit)
  }

  if (bulkOpsNew.length > 0) {
    await DataSetRow.insertMany(bulkOpsNew)
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
