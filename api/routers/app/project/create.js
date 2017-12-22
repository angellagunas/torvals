const Route = require('lib/router/route')
const lov = require('lov')

const {Project} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    adjustment: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: ctx.state.organization._id,
      adjustment: data.adjustment
    })

    ctx.body = {
      data: project
    }
  }
})
