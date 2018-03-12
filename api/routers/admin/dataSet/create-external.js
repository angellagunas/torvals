const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Project } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

module.exports = new Route({
  method: 'post',
  path: '/addExternal',
  validator: lov.object().keys({
    uuid: lov.string().required(),
    project: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    let project, org, dataset

    project = await Project.findOne({uuid: body.project})
      .populate('organization')

    if (!project) {
      ctx.throw(404, 'Proyecto no encontrado')
    }

    org = project.organization

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/datasets/${body.uuid}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true,
      persist: true
    }

    try {
      var res = await request(options)

      dataset = await DataSet.create({
        name: body.name || 'New External',
        description: body.description,
        organization: org._id,
        createdBy: ctx.state.user,
        uploadedBy: ctx.state.user,
        uploaded: true,
        project: project._id,
        externalId: body.uuid,
        source: 'external'
      })

      if (project) {
        project.datasets.push({
          dataset: dataset,
          columns: []
        })

        await project.save()
      }

      await dataset.process(res)
    } catch (e) {
      ctx.throw(401, 'Falló al enviar dataset para conciliación')
    }

    ctx.body = {
      data: dataset
    }
  }
})
