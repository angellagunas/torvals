// node tasks/dataset/generate-download.js --uuid
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { AdjustmentDownload, DataSet, DataSetRow } = require('models')
const { aws } = require('../../config')
const awsService = require('aws-sdk')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')

const task = new Task(async function (argv) {
  console.log('Fetching Dataset...')

  const dataset = await DataSet.findOne({uuid: argv.uuid, source: 'adjustment'}).populate('rule')

  if (!dataset) {
    throw new Error('Dataset not found')
  }

  const datasetRow = await DataSetRow.find({dataset: dataset}).populate('organization product catalogItems')
  let fileName = dataset.uuid + '.csv'
  const filePath = path.resolve('.', 'media', 'uploads', fileName)
  let writer = fs.createWriteStream(filePath)
  let i = 0
  let catalogs = []
  for (let catalog of dataset.rule.catalogs) {
    if (i++) { writer.write(',') }
    writer.write(catalog.name + '_id' + ',' + catalog.name)
    catalogs.push(catalog.slug)
  }
  writer.write(',forecastDate,prediction,sale,adjustment,lastAdjustment')
  writer.write('\r\n')

  for (let row of datasetRow) {
    i = 0
    for (let cat of catalogs) {
      let item = _.find(row.catalogItems, {type: cat})
      if (i++) { writer.write(',') }
      writer.write(item.externalId + ',' + item.name)
    }
    writer.write(',' + row.data.forecastDate + ',' + row.data.prediction + ',' + row.data.sale + ',' + row.data.adjustment + ',' + row.data.lastAdjustment)
    writer.write('\r\n')
  }

  await new Promise((resolve, reject) => {
    writer.close(async () => {
      fileName = 'datasets/' + fileName
      let bucket = aws.s3Bucket

      var s3File = {
        ContentType: 'text/csv',
        Bucket: bucket,
        ACL: 'public-read'
      }

      s3File['Body'] = await fs.readFile(filePath)
      s3File['Key'] = fileName

      try {
        var s3 = new awsService.S3({
          credentials: {
            accessKeyId: aws.s3AccessKey,
            secretAccessKey: aws.s3Secret
          },
          region: aws.s3Region
        })

        await s3.putObject(s3File).promise()
      } catch (e) {
        console.error(e)
        reject(e)
      }

      await AdjustmentDownload.create({
        organization: dataset.organization,
        path: fileName,
        project: dataset.project,
        dataset: dataset._id
      })
      await fs.unlink(filePath)
      console.log('Successfully uploaded')
      resolve()
    })
  })

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
