const Route = require('lib/router/route')
const lov = require('lov')

const { Project, Rule } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const rule = await Rule.findOne({
      organization: ctx.state.organization._id,
      isCurrent: true,
      isDeleted: false
    })
    ctx.assert(rule, 422, 'No hay Reglas de negocio definidas')

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: ctx.state.organization._id,
      adjustment: data.adjustment,
      createdBy: ctx.state.user,
      rule: rule
    })

    project.rule = rule

    ctx.body = {
      data: project
    }
  }
})
