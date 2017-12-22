const Route = require('lib/router/route')

const {Project} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid

    var project = await Project.findOne({'uuid': projectId})
    ctx.assert(project, 404, 'Project not found')

    project.set({
      isDeleted: true
    })

    await project.save()

    ctx.body = {
      data: project
    }
  }
})
