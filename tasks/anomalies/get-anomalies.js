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

  var res = {_items: [
    {
      'canal_id': '4',
      'fecha': '2018-05-10',
      'producto_nombre': 'Chips Jalapeno 60G Bar',
      'semana_bimbo': '20',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31561',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': 'dece761a-5244-4a3c-9c32-bc40024565af',
      'prediccion': '3464',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-05-31',
      'producto_nombre': 'Chips Jalapeno 60G Bar',
      'semana_bimbo': '23',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31561',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': 'a12b5374-73e0-4451-83b3-8708f116f99c',
      'prediccion': '3367',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-05-31',
      'producto_nombre': 'Chips Fuego 55G Bar',
      'semana_bimbo': '23',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31088',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': '5a87e197-115d-4b51-b2c6-b55f84a8f1f6',
      'prediccion': '2805',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-05-17',
      'producto_nombre': 'Chips Jalapeno 60G Bar',
      'semana_bimbo': '21',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31561',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': '3cf613af-8d18-4009-88c4-6285de552495',
      'prediccion': '3329',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-06-14',
      'producto_nombre': 'Chips Fuego 55G Bar',
      'semana_bimbo': '25',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31088',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': '87070118-9c43-4193-8bc3-120a2ad86815',
      'prediccion': '2805',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-05-24',
      'producto_nombre': 'Chips Fuego 55G Bar',
      'semana_bimbo': '22',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31088',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': 'e0d78f89-990f-40a4-83d6-65e039509f91',
      'prediccion': '2454',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-05-10',
      'producto_nombre': 'Chips Fuego 170G Bar',
      'semana_bimbo': '20',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31090',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': '1c6b8d29-539d-4b7f-a912-da8c31a18d92',
      'prediccion': '529',
      'type': 'zero_sales'
    },
    {
      'canal_id': '4',
      'fecha': '2018-06-07',
      'producto_nombre': 'Chips Fuego 55G Bar',
      'semana_bimbo': '24',
      'canal_nombre': 'conveniencia',
      '_created': 1519634190.78186,
      'dataset_id': 'b00519eb-dedf-4470-b9bb-3a9f550b4d3f',
      'producto_id': '31088',
      '_updated': 1519634190.78186,
      'agencia_id': '12837',
      '_id': 'd08eb1d8-d724-4a1d-9a52-265ca50b729c',
      'prediccion': '2805',
      'type': 'zero_sales'
    }
  ]}// await request(options)
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
