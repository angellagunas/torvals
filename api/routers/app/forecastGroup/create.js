const Route = require('lib/router/route')
const {ForecastGroup, Project} = require('models')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    project: lov.string().required(),
    alias: lov.string().required()
  }),
  handler: async function (ctx) {
    let data = ctx.request.body
    let user = ctx.state.user

    let project = await Project.findOne({uuid: data.project})
    ctx.assert(project, 404, 'Proyecto no encontrado')

    let forecast = await ForecastGroup.create({
      project: project._id,
      alias: data.alias,
      createdBy: user._id
    })

    ctx.body = forecast
  }
})
