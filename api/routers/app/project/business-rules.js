const lov = require('lov')
const cloneMainDataset = require('tasks/project/clone-main-dataset')
const Route = require('lib/router/route')

const { Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/update/businessRules',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    const data = ctx.request.body

    if (!data.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const project = await Project.findOne({
      'uuid': data.uuid,
      'isDeleted': false,
      status: 'updating-rules'
    }).populate('mainDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    await cloneMainDataset.run({
      uuid: project.uuid
    })

    ctx.body = {
      data: project
    }
  }
})
