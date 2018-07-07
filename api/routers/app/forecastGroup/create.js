const Route = require('lib/router/route')
const {ForecastGroup, Project, Catalog, Cycle, Engine} = require('models')
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

    let catalogs = await Catalog.find({uuid: {$in: data.catalogs}})
    catalogs.data = catalogs.map(item => {
      return item._id
    })

    let cycles = await Cycle.getBetweenDates(project.organization, project.rule, data.dateStart, data.dateEnd)
    cycles.data = cycles.map(item => {
      return item._id
    })

    let engines = await Engine.find({uuid: {$in: data.engines}})
    engines.data = engines.map(item => {
      return item._id
    })

    let forecast = await ForecastGroup.create({
      project: project._id,
      alias: data.alias,
      catalogs: catalogs.data,
      cycles: cycles,
      engines: engines,
      createdBy: user._id,
      type: data.type
    })

    ctx.body = forecast
  }
})
