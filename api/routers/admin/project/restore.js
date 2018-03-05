const Route = require('lib/router/route')

const {Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': true})
    .populate('datasets.dataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    for (var d of project.datasets) {
      d.dataset.isDeleted = false
      await d.dataset.save()
    }

    project.set({
      isDeleted: false
    })

    await project.save()

    ctx.body = {
      data: project
    }
  }
})
