const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body
    console.log(data)

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization')
    ctx.assert(project, 404, 'Project not found')

    const org = await Organization.findOne({uuid: data.organization})
    ctx.assert(org, 404, 'Organization not found')

    data.organization = org

    project.set({
      name: data.name,
      description: data.description,
      organization: data.organization
    })

    project.save()

    ctx.body = {
      data: project
    }
  }
})
