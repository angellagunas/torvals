const lov = require('lov')
const cloneMainDataset = require('queues/clone-main-dataset')
const Route = require('lib/router/route')

const { Project, Rule } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/update/businessRules',
  validator: lov.object().keys({
    uuid: lov.string().required()
  }),
  handler: async function (ctx) {
    const data = ctx.request.body

    if (!data.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const project = await Project.findOne({
      'uuid': data.uuid,
      'isDeleted': false
    }).populate('mainDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    const rule = await Rule.findOne({
      'isCurrent': true,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    })

    project.set({
      outdated: false,
      rule: rule
    })

    await project.save()

    cloneMainDataset.add({
      uuid: project.uuid
    })

    ctx.body = {
      data: project
    }
  }
})
