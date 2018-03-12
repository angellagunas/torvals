const Route = require('lib/router/route')
const { Project, SalesCenter, Channel } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')
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
      ctx.throw(404, 'No hay DataSet activo para el proyecto')
    }

    try {
      var apiData = Api.get()

      if (!apiData.token) {
        await Api.fetch()
        apiData = Api.get()
      }
    } catch (e) {
      ctx.throw(401, 'Falló al conectar con servidor (Abraxas)')
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

    if (data.period) {
      requestBody.periodo = data.period
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/download/projects/${project.externalId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: requestBody,
      json: true,
      persist: true
    }

    try {
      var res = await request(options)
    } catch (e) {
      ctx.throw(401, 'Falló al obtener archivo (Abraxas)')
    }

    ctx.set('Content-disposition', `attachment; filename=datasetrow.csv`)
    ctx.set('Content-type', `text/csv`)

    ctx.body = res
  }
})
