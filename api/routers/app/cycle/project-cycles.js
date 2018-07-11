const Route = require('lib/router/route')

const { Project, Cycle, Rule } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/project/:uuid',
  handler: async function (ctx) {
    var uuid = ctx.params.uuid

    const project = await Project.findOne({'uuid': uuid, 'isDeleted': false})
    ctx.assert(project, 404, 'Proyecto no encontrado')

    if (project.organization !== ctx.state.organization._id) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const rule = await Rule.findOne({_id: project.rule})
    ctx.assert(rule, 404, 'Regla de negocios no encontrada')

    var cycle = await Cycle.find({isDeleted: false, rule: rule._id})

    cycle.data = cycle.map(item => {
      return item.toPublic()
    })

    ctx.body = {
      data: cycle.data
    }
  }
})
