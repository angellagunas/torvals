const Route = require('lib/router/route')
const { Anomaly, Project } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')
const _ = require('lodash')

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
    try {
      var apiData = Api.get()
      if (!apiData.token) {
        await Api.fetch()
        apiData = Api.get()
      }
    } catch (e) {
      ctx.throw(503, 'Abraxas API no disponible para la conexión')
    }

    const requestBody = {}
    for (var anomaly in data.anomalies) {
      anomaly = await Anomaly.findOne({uuid: anomaly.uuid})
      if (anomaly) {
        requestBody.push({data_rows_id: anomaly.externalId, prediction: anomaly.prediction})
      }
    }

    // check project etag
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/projects/${project.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true,
      persist: true
    }
    var etag = project.etag || ''
    try {
      let res = await request(options)
      project.set({etag: res._etag})
      await project.save()
      etag = res._etag
    } catch (e) {
      let errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      if (!errorString) {
        errorString = []
        errorString[1] = e.message
      }
      ctx.throw(503, 'Abraxas API: ' + errorString[1])

      return false
    }

    options = {
      url: `${apiData.hostname}${apiData.baseUrl}/restore_anomalies/projects/${project.externalId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`,
        'If-Match': etag
      },
      body: requestBody,
      json: true,
      persist: true
    }

    try {
      var responseData = await request(options)
    } catch (e) {
      let errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      if (!errorString) {
        errorString = []
        errorString[1] = e.message
      }
      ctx.throw(503, 'Abraxas API: ' + errorString[1])

      return false
    }

    ctx.body = {
      data: responseData
    }
  }
})
