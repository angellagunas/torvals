// node tasks/generate-download.js --uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { AdjustmentDownload, DataSet, DataSetRow } = require('models')
const { aws } = require('../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const { v4 } = require('uuid')
const path = require('path')

const task = new Task(async function (argv) {
  console.log('Fetching Dataset...')

  const dataset = await DataSet.findOne({uuid: argv.uuid, source: 'adjustment'})

  if (!dataset) {
    throw new Error('Dataset not found')
  }

  const datasetRow = await DataSetRow.find({dataset: dataset})
  var identifier = v4
  const filePath = path.resolve('.', 'media', 'uploads', identifier)
  let writer = fs.createWriteStream(filePath)
  for (let row of datasetRow) {
    writer.write(row)
  }
  console.log('Successfully uploaded')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
