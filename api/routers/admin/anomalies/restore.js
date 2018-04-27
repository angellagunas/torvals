const Route = require('lib/router/route')
const { Anomaly, Project } = require('models')
const Api = require('lib/abraxas/api')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')
    if (!project.activeDataset) {
      ctx.throw(404, 'No hay DataSet activo para el proyecto')
    }

    const requestBody = {}
    for (var anomaly in data.anomalies) {
      anomaly = await Anomaly.findOne({uuid: anomaly.uuid})
      if (anomaly) {
        requestBody.push({data_rows_id: anomaly.externalId, prediction: anomaly.prediction})
      }
    }

    // check project etag
    var etag = project.etag || ''
    const res = await Api.getProject(project.externalId)
    project.set({etag: res._etag})
    await project.save()
    etag = res._etag

    const responseData = await Api.restoreAnomalies(project.externalId, etag, requestBody)

    ctx.body = {
      data: responseData
    }
  }
})
