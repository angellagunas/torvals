// node tasks/anomalies/get-anomalies.js --uuid uuid
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Product, Channel, DataSet, Anomaly, SalesCenter, Project } = require('models')
const request = require('lib/request')
const moment = require('moment')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }
  console.log('Fetching Anomalies ...')

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()
  const project = await Project.findOne({uuid: argv.uuid}).populate('activeDataset')
  if (!project) {
    throw new Error('Project not found')
  }

  var options = {
    url: `${apiData.hostname}${apiData.baseUrl}/anomalies/projects/${project.externalId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiData.token}`
    },
    body: {},
    json: true,
    persist: true
  }

  var res = await request(options)
  if (!project.activeDataset) {
    return false
  }
  for (var p of res._items) {
    var salesCenterExternalId = project.activeDataset.getSalesCenterColumn() || {name: ''}
    var productExternalId = project.activeDataset.getProductColumn() || {name: ''}
    var channelExternalId = project.activeDataset.getChannelColumn() || {name: ''}
    var predictionColumn = project.activeDataset.getPredictionColumn() || {name: ''}

    var salesCenter = await SalesCenter.findOne({
      externalId: p[salesCenterExternalId.name],
      organization: project.activeDataset.organization
    })
    var product = await Product.findOne({
      externalId: p[productExternalId.name],
      organization: project.activeDataset.organization
    })
    var channel = await Channel.findOne({
      externalId: p[channelExternalId.name],
      organization: project.activeDataset.organization
    })

    try {
      var anomaly = Anomaly.findOne({
        externalId: p._id,
        dataset: project.activeDataset._id
      })

      if (!anomaly) {
        await Anomaly.create({
          channel: channel,
          dataset: project.activeDataset._id,
          product: product,
          salesCenter: salesCenter,
          externalId: p._id,
          prediction: p[predictionColumn.name],
          semanaBimbo: p.semana_bimbo,
          organization: project.activeDataset.organization,
          type: p.type,
          date: moment(p.fecha).utc(),
          apiData: p
        })
      }
    } catch (e) {
      console.log('Error trying to save anomaly: ')
      console.log(p)
      console.log(e)
    }
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
