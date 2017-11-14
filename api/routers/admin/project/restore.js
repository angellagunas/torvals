const Route = require('lib/router/route')
const lov = require('lov')

const {Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/restore/:uuid',
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': true})
    ctx.assert(project, 404, 'Project not found')

    project.set({
      isDeleted: false
    })

    project.save()

    ctx.body = {
      data: project
    }
  }
})
