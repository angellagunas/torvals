const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string(),
    project: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    let project, org

    project = await Project.findOne({uuid: body.project}).populate('organization')

    if (!project) {
      ctx.throw(404, 'Project not found')
    }

    org = project.organization

    const dataset = await DataSet.create({
      name: body.name,
      description: body.description,
      organization: org._id,
      createdBy: ctx.state.user,
      project: project._id
    })

    if (project) {
      project.datasets.push({
        dataset: dataset,
        columns: []
      })

      await project.save()
    }

    ctx.body = {
      data: dataset
    }
  }
})
