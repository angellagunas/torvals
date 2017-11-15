const Route = require('lib/router/route')

const {Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization')
    ctx.assert(project, 404, 'Project not found')

    ctx.body = {
      data: {
        name: project.name,
        organization: project.organization.uuid,
        description: project.description
      }
    }
  }
})
