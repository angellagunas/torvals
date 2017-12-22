const Route = require('lib/router/route')
const lov = require('lov')

const {Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    adjustment: lov.string().required()
  }),
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization')
    ctx.assert(project, 404, 'Project not found')

    project.set({
      name: data.name,
      description: data.description,
      adjustment: data.adjustment
    })

    project.save()

    ctx.body = {
      data: project
    }
  }
})
