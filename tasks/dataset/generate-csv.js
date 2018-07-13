// node tasks/dataset/generate-download.js --uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const _ = require('lodash')

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
    .populate('organization product catalogItems newProduct').cursor()

  let fileName = dataset.uuid + '.csv'
  const filePath = path.resolve('.', 'media', 'uploads', fileName)
  let writer = fs.createWriteStream(filePath)
  let i = 0
  let catalogs = []
  await dataset.rule.populate('catalogs').execPopulate()

  for (let catalog of dataset.rule.catalogs) {
    if (i++) { writer.write(',') }
    writer.write(catalog.name + '_id' + ',' + catalog.name)
    catalogs.push(catalog.slug)
  }

  writer.write(',forecastDate,prediction,sale,adjustment,lastAdjustment')
  writer.write('\r\n')

  for (let row = await datasetRow.next(); row != null; row = await datasetRow.next()) {
    i = 0
    for (let cat of catalogs) {
      if (i++) { writer.write(',') }
      if (cat === 'producto') {
        writer.write(row.newProduct.externalId + ',' + row.newProduct.name)
      } else {
        let item = _.find(row.catalogItems, {type: cat})
        writer.write(item.externalId + ',' + item.name)
      }
    }
    writer.write(',' + moment.utc(row.data.forecastDate).format('YYYY-MM-DD') + ',' + row.data.prediction + ',' + row.data.sale + ',' + row.data.adjustment + ',' + row.data.lastAdjustment)
    writer.write('\r\n')
  }

  await new Promise((resolve, reject) => {
    writer.end(() => { resolve() })
  })

  console.log('Successfully generated')

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
