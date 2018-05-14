// node tasks/anomalies/get-anomalies.js --uuid uuid
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Product, Channel, Anomaly, SalesCenter, Project } = require('models')
const moment = require('moment')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }
  console.log('Fetching Anomalies ...')

  const project = await Project.findOne({uuid: argv.uuid}).populate('activeDataset')
  if (!project) {
    throw new Error('Project not found')
  }

  try {
    var res = await Api.getAnomalies(project.externalId)
  } catch (e) {
    console.log(e.message)
    return false
  }

  if (!project.activeDataset) {
    return false
  }

  let products = await Product.find({organization: project.activeDataset.organization})
  let salesCenters = await SalesCenter.find({organization: project.activeDataset.organization})
  let channels = await Channel.find({organization: project.activeDataset.organization})

  let productsObj = {}
  let salesCentersObj = {}
  let channelsObj = {}

  let bulkOps = []

  for (let prod of products) {
    productsObj[prod.externalId] = prod._id
  }

  for (let sc of salesCenters) {
    salesCentersObj[sc.externalId] = sc._id
  }

  for (let chan of channels) {
    channelsObj[chan.externalId] = chan._id
  }

  delete products
  delete salesCenters
  delete channels

  var salesCenterExternalId = project.activeDataset.getSalesCenterColumn() || {name: ''}
  var productExternalId = project.activeDataset.getProductColumn() || {name: ''}
  var channelExternalId = project.activeDataset.getChannelColumn() || {name: ''}
  var predictionColumn = project.activeDataset.getPredictionColumn() || {name: ''}

  console.log(`${res._items.length} anomalies to save!`)
  
  for (var p of res._items) {
    let salesCenter = p[salesCenterExternalId.name]
    let product = p[productExternalId.name]
    let channel = p[channelExternalId.name]

    try {
      var anomaly = await Anomaly.findOne({
        externalId: p._id,
        dataset: project.activeDataset._id
      })

      if (!anomaly) {
        bulkOps.push({
          salesCenter: salesCentersObj[salesCenter],
          product: productsObj[product],
          channel: channelsObj[channel],
          dataset: project.activeDataset._id,
          externalId: p._id,
          prediction: p[predictionColumn.name],
          semanaBimbo: p.semana_bimbo,
          organization: project.activeDataset.organization,
          type: p.type,
          date: moment(p.fecha).utc(),
          apiData: p
        })

        // await Anomaly.create({
        //   salesCenter: salesCentersObj[salesCenter],
        //   product: productsObj[product],
        //   channel: channelsObj[channel],
        //   dataset: project.activeDataset._id,
        //   externalId: p._id,
        //   prediction: p[predictionColumn.name],
        //   semanaBimbo: p.semana_bimbo,
        //   organization: project.activeDataset.organization,
        //   type: p.type,
        //   date: moment(p.fecha).utc(),
        //   apiData: p
        // })
      }

      if (bulkOps.length === 1000) {
        console.log(`1000 anomalies saved!`)
        await Anomaly.insertMany(bulkOps)
        bulkOps = []
      }
    } catch (e) {
      console.log('Error trying to save anomaly: ')
      console.log(p)
      console.log(e)
    }
  }

  try {
    if (bulkOps.length > 0) await Anomaly.insertMany(bulkOps)
  }  catch (e) {
    console.log('Error trying to save anomaly: ')
    console.log(p)
    console.log(e)
  }

  console.log(`Received ${res._items.length} anomalies!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
