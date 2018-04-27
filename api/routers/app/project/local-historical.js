const Route = require('lib/router/route')
const { Project, SalesCenter, Channel, Product, DataSetRow } = require('models')
const _ = require('lodash')
const moment = require('moment')
const lov = require('lov')

module.exports = new Route({
  method: 'get',
  path: '/local/historical/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.query
    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')
    if (!project.activeDataset) {
      ctx.throw(404, 'No hay DataSet activo para el proyecto')
    }

    var match = []

    match.push({
      '$match': {
        dataset: project.activeDataset._id
      }
    })

    var dateColumn = project.activeDataset.getDateColumn() || {name: 'fecha'}

    // match.push({
    //   '$match': {
    //     [dateColumn.name]: {
    //       '$gte': moment(data.start_date),
    //       '$lte': moment(data.end_date)
    //     }
    //   }
    // })

    const requestBody = {
      date_start: data.start_date,
      date_end: data.end_date
    }

    if (data.salesCenter) {
      const agenciaName = project.activeDataset.getSalesCenterColumn() || {name: 'agencia_id'}
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')
      // match[agenciaName.name] = salesCenter._id
    }

    if (data.channel) {
      const channelName = project.activeDataset.getChannelColumn() || {name: 'canal_id'}
      const channel = await Channel.findOne({uuid: data.channel})
      ctx.assert(channel, 404, 'Canal no encontrado')
      // match[channelName.name] = channel._id
    }

    if (data.product) {
      const productName = project.activeDataset.getProductColumn() || {name: 'producto_id'}
      const product = await Product.findOne({uuid: data.product})
      ctx.assert(product, 404, 'Producto no encontrado')
      // match[productName.name] = product._id
    }

    console.log(match)
    match.push({
      '$group': {
        _id: '$data.semanaBimbo',
        prediction: { $sum: '$data.prediction' },
        adjustment: { $sum: '$data.adjustment' }
      }
    })

    var responseData = await DataSetRow.aggregate(match)

    ctx.body = {
      data: responseData
    }
  }
})
