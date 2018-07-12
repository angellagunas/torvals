// node tasks/dataset/generate-download.js --uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')

const task = new Task(async function (argv) {
  console.log('Fetching Dataset...')

  const dataset = await DataSet.findOne({
    uuid: argv.uuid,
    source: 'adjustment'
  }).populate('rule')

  if (!dataset) {
    throw new Error('Dataset not found')
  }

  const datasetRow = await DataSetRow.find({dataset: dataset})
    .populate('product salesCenter channel')
    .cursor({batchSize: 1000})

  let fileName = dataset.uuid + '.csv'
  const filePath = path.resolve('.', 'media', 'uploads', fileName)
  let writer = fs.createWriteStream(filePath)

  writer.write('producto_id,producto_nombre,centro_de_venta,canal,canal_nombre,forecastDate,prediction,sale,adjustment,lastAdjustment')
  writer.write('\r\n')

  for (let row = await datasetRow.next(); row != null; row = await datasetRow.next()) {
    writer.write(row.product.externalId + ',' + row.product.name + ',' + row.apiData.agencia_id + ',' + row.apiData.canal_id + ',' + row.apiData.canal_nombre)
    writer.write(',' + moment.utc(row.data.forecastDate).format('YYYY-MM-DD') + ',' + row.data.prediction + ',' + row.data.sale + ',' + row.data.adjustment + ',' + row.data.lastAdjustment)
    writer.write('\r\n')
  }

  await new Promise((resolve, reject) => {
    writer.end(() => { resolve() })
  })

  console.log('Successfully uploaded')

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
