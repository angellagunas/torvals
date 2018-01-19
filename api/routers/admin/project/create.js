const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required(),
    adjustment: lov.string()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body
    const org = await Organization.findOne({uuid: data.organization})

    if (!org) {
      ctx.throw(404, 'Organization not found')
    }

    const project = await Project.create({
      name: data.name,
      description: data.description,
      organization: org._id,
      adjustment: data.adjustment
    })

    ctx.body = {
      data: project
    }
  }
})
