// node tasks/dataset/process/save-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { DataSetRow, Product, DataSet, SalesCenter, Channel } = require('models')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Saving products/sales centers/channels from catalog ...')
  console.log(`Start ==>  ${moment().format()}`)

  var batchSize = 10000

  const dataset = await DataSet.findOne({uuid: argv.uuid})
  if (!dataset) {
    throw new Error('Invalid uuid!')
  }
  const datasetrows = await DataSetRow.find({dataset: dataset._id}).cursor()
  if (!datasetrows) {
    throw new Error('No datasetrows to process')
  }

  var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
  var productExternalId = dataset.getProductColumn() || {name: ''}
  var channelExternalId = dataset.getChannelColumn() || {name: ''}

  var bulkOps = []

  let products = await Product.find({organization: dataset.organization})
  let salesCenters = await SalesCenter.find({organization: dataset.organization})
  let channels = await Channel.find({organization: dataset.organization})

  let productsObj = {}
  let salesCentersObj = {}
  let channelsObj = {}

  for (let prod of products) {
    productsObj[prod.externalId] = prod._id
  }

  for (let sc of salesCenters) {
    salesCentersObj[sc.externalId] = sc._id
  }

  for (let chan of channels) {
    channelsObj[chan.externalId] = chan._id
  }
  for (let dataRow = await datasetrows.next(); dataRow != null; dataRow = await datasetrows.next()) {
    try {
      let salesCenter = dataRow['apiData'][salesCenterExternalId.name]
      let product = dataRow['apiData'][productExternalId.name]
      let channel = dataRow['apiData'][channelExternalId.name]

      bulkOps.push(
        {
          'updateOne': {
            'filter': { '_id': dataRow._id },
            'update': { '$set': {
              salesCenter: salesCentersObj[salesCenter],
              product: productsObj[product],
              channel: channelsObj[channel]
            }}
          }
        }
      )

      if (bulkOps.length === batchSize) {
        console.log(`${batchSize} ops ==> ${moment().format()}`)
        await DataSetRow.bulkWrite(bulkOps)
        bulkOps = []
      }
    } catch (e) {
      console.log('Error!!')
      console.log(e)
      return false
    }
  }

  try {
    if (bulkOps.length > 0) await DataSetRow.bulkWrite(bulkOps)
    console.log(`Data saved ==> ${moment().format()}`)
  } catch (e) {
    console.log('Error!!')
    console.log(e)

    return false
  }

  dataset.set({ status: 'reviewing' })
  await dataset.save()

  console.log('Success! DatasetRows processed!')
  console.log(`End ==>  ${moment().format()}`)

  await sendSlackNotificacion.run({
    channel: 'opskamino',
    message: `El dataset *${dataset.name}* ha sido procesado y esta listo para conciliarse :pika:`
  })

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
