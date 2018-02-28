const Route = require('lib/router/route')

const {Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid

    const project = await Project.findOne({
      'uuid': projectId,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    }).populate('organization')
    .populate('activeDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    ctx.body = {
      data: project.toPublic()
    }
  }
})
