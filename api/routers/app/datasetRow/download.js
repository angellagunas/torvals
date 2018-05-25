const Route = require('lib/router/route')
const { Project, SalesCenter, Channel, Product, DataSetRow } = require('models')
const lov = require('lov')
const moment = require('moment')

module.exports = new Route({
  method: 'post',
  path: '/download/:uuid',
  validator: lov.object().keys({
    start_date: lov.string().required(),
    end_date: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    if (!project.activeDataset) {
      ctx.throw(400, 'No hay DataSet activo para el proyecto')
    }

    const filters = {
      'data.forecastDate': {
        $gte: moment.utc(data.start_date, 'YYYY-MM-DD'),
        $lte: moment.utc(data.end_date, 'YYYY-MM-DD')
      }
    }

    if (data.salesCenter) {
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')

      filters['salesCenter'] = salesCenter._id
    }

    if (data.channel) {
      const channel = await Channel.findOne({uuid: data.channel})
      ctx.assert(channel, 404, 'Canal no encontrado')

      filters['channel'] = channel._id
    }

    if (data.product) {
      const product = await Product.findOne({uuid: data.product})
      ctx.assert(product, 404, 'Producto no encontrado')

      filters['product'] = product._id
    }

    let rows = await DataSetRow.find({
      ...filters,
      isDeleted: false
    }).populate('product channel salesCenter')

    var rowsCsv = 'fecha,producto,producto_nombre,prediccion,ajuste,agencia,agencia_nombre,canal,canal_nombre\r\n'

    for (let i = 0; i < rows.length; i++) {
      rowsCsv += rows[i].data.forecastDate + ',' + rows[i].product.externalId + ',' + rows[i].product.name + ',' +
        rows[i].data.prediction + ',' + rows[i].data.adjustment + ',' + rows[i].salesCenter.externalId + ',' +
        rows[i].salesCenter.name + ',' + rows[i].channel.externalId + ',' + rows[i].channel.name + ',' + '\r\n'
    }

    ctx.set('Content-disposition', `attachment; filename=datasetrow.csv`)
    ctx.set('Content-type', `text/csv`)

    ctx.body = rowsCsv
  }
})
