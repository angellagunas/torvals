// node tasks/dataset/generate-download.js --uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { AdjustmentDownload, DataSet, DataSetRow } = require('models')
const { aws } = require('../../config')
const awsService = require('aws-sdk')
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
    .populate('product salesCenter channel')
    .cursor({batchSize: 1000})

  let fileName = dataset.uuid + '.csv'
  const filePath = path.resolve('.', 'media', 'uploads', fileName)
  let writer = fs.createWriteStream(filePath)
  let i = 0
  let catalogs = []
  // await dataset.rule.populate('catalogs').execPopulate()

  // for (let catalog of dataset.rule.catalogs) {
  //   if (i++) { writer.write(',') }
  //   writer.write(catalog.name + '_id' + ',' + catalog.name)
  //   catalogs.push(catalog.slug)
  // }

  writer.write('producto_id,producto_nombre,centro_de_venta,canal,canal_nombre,forecastDate,prediction,sale,adjustment,lastAdjustment')
  writer.write('\r\n')

  for (let row = await datasetRow.next(); row != null; row = await datasetRow.next()) {
    // console.log(row)
    writer.write(row.product.externalId + ',' + row.product.name + ',' + row.apiData.agencia_id + ',' + row.apiData.canal_id + ',' + row.apiData.canal_nombre)
    writer.write(',' + moment.utc(row.data.forecastDate).format('YYYY-MM-DD') + ',' + row.data.prediction + ',' + row.data.sale + ',' + row.data.adjustment + ',' + row.data.lastAdjustment)
    writer.write('\r\n')
  }

  await new Promise((resolve, reject) => {
    writer.end(() => { resolve() })
  })

  fileName = 'datasets/' + fileName
  let bucket = aws.s3Bucket

  // var s3File = {
  //   ContentType: 'text/csv',
  //   Bucket: bucket,
  //   ACL: 'public-read'
  // }

  // s3File['Body'] = await fs.readFile(filePath)
  // s3File['Key'] = fileName

  // try {
  //   var s3 = new awsService.S3({
  //     credentials: {
  //       accessKeyId: aws.s3AccessKey,
  //       secretAccessKey: aws.s3Secret
  //     },
  //     region: aws.s3Region
  //   })

  //   await s3.putObject(s3File).promise()
  // } catch (e) {
  //   console.error(e)
  // }

  // await AdjustmentDownload.create({
  //   organization: dataset.organization,
  //   path: {
  //     url: fileName,
  //     bucket: bucket,
  //     region: aws.s3Region
  //   },
  //   project: dataset.project,
  //   dataset: dataset._id
  // })
  // await fs.unlink(filePath)
  console.log('Successfully uploaded')

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
