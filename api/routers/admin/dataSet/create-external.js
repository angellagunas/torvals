const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Project } = require('models')
const Api = require('lib/abraxas/api')

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

    const res = await Api.getDataset(body.uuid)

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

    ctx.body = {
      data: dataset
    }
  }
})
