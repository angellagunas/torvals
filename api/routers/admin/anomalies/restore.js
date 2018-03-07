const Route = require('lib/router/route')
const { Anomaly, Project } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')
const _ = require('lodash')
const moment = require('moment')
const lov = require('lov')

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
      ctx.throw(401, 'Falló al conectar con servidor (Abraxas)')
    }

    const requestBody = {}
    for (anomaly in data.anomalies) {
      var anomaly = await Anomaly.findOne({uuid: anomaly.uuid})
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
      var res = await request(options)
      project.set({etag: res._etag})
      await project.save()
      etag = res._etag
    } catch (e) {
      ctx.throw(401, 'Falló al obtener proyecto (Abraxas)')
    }

    var options = {
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
      var res = await request(options)
      var responseData = res
    } catch (e) {
      ctx.throw(401, 'Falló al obtener anomalías (Abraxas)')
    }

    ctx.body = {
      data: responseData
    }
  }
})
