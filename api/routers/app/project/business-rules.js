const Route = require('lib/router/route')
const lov = require('lov')

const { Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/update/businessRules/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    const projectId = ctx.params.uuid
    const data = ctx.request.body

    const project = await Project.findOne({
      'uuid': projectId,
      'isDeleted': false
    }).populate('organization')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    project.set({
      status: 'updating-rules'
    })
    project.save()

    ctx.body = {
      data: project
    }
  }
})
