const Route = require('lib/router/route')
const {ForecastGroup, Project, Catalog, Cycle, Engine, Forecast, DataSet} = require('models')
const lov = require('lov')
const { v4 } = require('uuid')

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

    let project = await Project.findOne({uuid: data.project}).populate('mainDataset')
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

    let forecastGroup = await ForecastGroup.create({
      project: project._id,
      alias: data.alias,
      catalogs: catalogs.data,
      cycles: cycles.data,
      engines: engines.data,
      createdBy: user._id,
      type: data.type
    })

    for (let engine of engines.data) {
      let dataset = await DataSet.create({
        name: data.alias,
        organization: project.organization,
        project: project._id,
        createdBy: ctx.state.user,
        dateMax: data.dateStart,
        dateMin: data.dateMin,
        status: 'new',
        source: 'forecast',
        columns: project.mainDataset.columns,
        products: project.mainDataset.products,
        newProducts: project.mainDataset.newProducts,
        catalogItems: project.mainDataset.catalogItems,
        cycles: project.mainDataset.cycles,
        periods: project.mainDataset.periods,
        rule: project.rule
      })

      let forecast = await Forecast.create({
        catalogs: catalogs.data,
        engine: engine,
        forecastGroup: forecastGroup._id,
        dateEnd: data.dateEnd,
        dateStart: data.dateStart,
        dataset: dataset._id,
        instanceKey: v4()
      })

      forecastGroup.forecasts.push(forecast._id)
    }

    await forecastGroup.save()

    ctx.body = forecastGroup
  }
})
