const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    let project

    if (body.project) {
      project = await Project.findOne({uuid: body.project})
    }

    const dataset = await DataSet.create({
      name: body.name,
      description: body.description,
      organization: ctx.state.organization._id,
      createdBy: ctx.state.user,
      project: project
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
