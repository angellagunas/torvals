const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Organization, Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string(),
    organization: lov.string()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    let project, org

    if (body.project) {
      project = await Project.findOne({uuid: body.project}).populate('organization')
      org = project.organization
    } else {
      org = await Organization.findOne({uuid: body.organization})

      if (!org) {
        ctx.throw(404, 'Organization not found')
      }
    }

    const dataset = await DataSet.create({
      name: body.name,
      description: body.description,
      organization: org,
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
