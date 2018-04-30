const Route = require('lib/router/route')
const lov = require('lov')

const { Project, Organization } = require('models')
const Api = require('lib/abraxas/api')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const org = await Organization.findOne({uuid: data.organization})

    if (!org) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: org._id,
      adjustment: data.adjustment,
      createdBy: ctx.state.user
    })

    const res = await Api.postProject(project.uuid, org.uuid)
    project.set({
      externalId: res._id,
      etag: res._etag
    })

    await project.save()

    ctx.body = {
      data: project
    }
  }
})
