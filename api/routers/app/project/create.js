const Route = require('lib/router/route')
const lov = require('lov')

const { Project } = require('models')
const Api = require('lib/abraxas/api')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: ctx.state.organization._id,
      adjustment: data.adjustment,
      createdBy: ctx.state.user
    })

    var res = await Api.postProject(project.uuid, ctx.state.organization.uuid)

    project.set({
      externalId: res._id
    })

    await project.save()

    ctx.body = {
      data: project
    }
  }
})
