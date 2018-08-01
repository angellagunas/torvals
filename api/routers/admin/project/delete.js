const Route = require('lib/router/route')
const {Project} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid

    var project = await Project.findOne({'uuid': projectId})
    .populate('datasets.dataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    for (var d of project.datasets) {
      d.dataset.isDeleted = true
      await d.dataset.save()
    }

    project.set({
      isDeleted: true
    })

    await project.save()

    ctx.body = {
      data: project
    }
  }
})