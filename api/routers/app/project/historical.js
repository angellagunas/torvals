const Route = require('lib/router/route')
const { Project, SalesCenter, Channel, Product, AbraxasDate } = require('models')
const Api = require('lib/abraxas/api')
const _ = require('lodash')
const moment = require('moment')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/historical/:uuid',
  validator: lov.object().keys({
    start_date: lov.string().required(),
    end_date: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')
    if (!project.activeDataset) {
      ctx.throw(404, 'No hay DataSet activo para el proyecto')
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
      requestBody[productName.name] = data.product
    }
    if (data.category) {
      requestBody.categoria_id = data.category
    }

    const res = await Api.graphicProject(project.externalId, requestBody)
    const abraxasDates = await AbraxasDate.find()
    var responseData = {}
    for (let section in res) {
      responseData[section] = res[section].map(item => {
        let aDate = _.filter(abraxasDates, function (dateitem) {
          return _.inRange(
              (moment(item.x).unix()) * 1000,
              (moment(dateitem.dateStart).unix()) * 1000,
              (moment(dateitem.dateEnd).unix()) * 1000
            )
        })
        return {
          x: item.x,
          y: item.y,
          text: item.text,
          group: item.group,
          abraxasDate: aDate
        }
      })
    }
    ctx.body = {
      data: responseData
    }
  }
})
