const Route = require('lib/router/route')
const { Project, SalesCenter, Channel, Product } = require('models')
const Api = require('lib/abraxas/api')
const lov = require('lov')

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

    const requestBody = {
      date_start: data.start_date,
      date_end: data.end_date
    }

    if (data.salesCenter) {
      const agenciaName = project.activeDataset.getSalesCenterColumn() || {name: 'agencia_id'}
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')

      requestBody[agenciaName.name] = salesCenter.externalId
    }

    if (data.channel) {
      const channelName = project.activeDataset.getChannelColumn() || {name: 'canal_id'}
      const channel = await Channel.findOne({uuid: data.channel})
      ctx.assert(channel, 404, 'Canal no encontrado')

      requestBody[channelName.name] = channel.externalId
    }

    if (data.product) {
      const productName = project.activeDataset.getProductColumn() || {name: 'producto_id'}
      const product = await Product.findOne({uuid: data.product})
      ctx.assert(product, 404, 'Producto no encontrado')

      requestBody[productName.name] = product.externalId
    }

    if (data.period) {
      requestBody.periodo = data.period
    }

    const res = await Api.downloadProject(project.externalId, requestBody)

    ctx.set('Content-disposition', 'attachment; filename=dataset_filtered.csv')
    ctx.set('Content-type', `text/csv`)

    ctx.body = res
  }
})
