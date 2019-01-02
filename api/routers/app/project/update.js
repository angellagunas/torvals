const Route = require('lib/router/route')
const lov = require('lov')

const {Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    project.set({
      name: data.name,
      description: data.description,
      status: data.status,
      cycleType: data.cycleType || 'add',
      cycleTypeValue: data.cycleTypeValue || 6
    })

    if (data.showOnDashboard !== undefined) {
      project.set({
        showOnDashboard: data.showOnDashboard
      })
    }

    project.save()

    ctx.body = {
      data: project
    }
  }
})
