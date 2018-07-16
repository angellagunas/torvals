const Route = require('lib/router/route')
const {
  ForecastGroup,
  Project,
  Catalog,
  Cycle,
  Engine,
  Forecast,
  DataSet,
  Period
} = require('models')
const lov = require('lov')
const moment = require('moment')
const { v4 } = require('uuid')
const generateForecast = require('queues/pio-create-app')
const generateCycles = require('tasks/organization/generate-cycles')

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
      .populate('mainDataset rule organization')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    let catalogs
    let cycles
    if (data.type === 'compatible') {
      catalogs = {data: project.rule.catalogs}

      // cycles = await Cycle.getCurrent(project.organization, project.rule._id)
      cycles = project.rule.cyclesAvailable
      let cyclesAvailable = await Cycle.getAvailable(
        project.organization._id,
        project.rule._id,
        cycles
      )

      if (cyclesAvailable.length < cycles) {
        await generateCycles.run({
          uuid: project.organization.uuid,
          rule: project.rule.uuid,
          extraDate: project.mainDataset.dateMin
        })

        let today = moment.utc()

        if (today.isAfter(moment.utc(project.mainDataset.dateMax, 'YYYY-MM-DD'))) {
          let seasonDuration = moment.duration(
            project.rule.season * project.rule.cycleDuration,
            project.rule.cycle
          )
          await generateCycles.run({
            uuid: project.organization.uuid,
            rule: project.rule.uuid,
            extraDate: today.add(seasonDuration).format('YYYY-MM-DD')
          })
        } else {
          await generateCycles.run({
            uuid: project.organization.uuid,
            rule: project.rule.uuid,
            extraDate: project.mainDataset.dateMax
          })
        }

        cyclesAvailable = await Cycle.getAvailable(
          project.organization._id,
          project.rule._id,
          cycles
        )
      }
      cycles.data = cyclesAvailable.map(item => { return item._id })
    } else {
      catalogs = await Catalog.find({uuid: {$in: data.catalogs}})
      catalogs.data = catalogs.map(item => {
        return item._id
      })

      cycles = await Cycle.getBetweenDates(project.organization, project.rule._id, data.dateStart, data.dateEnd)
      cycles.data = cycles.map(item => {
        return item._id
      })
    }

    let periods = await Period.find({cycle: {$in: cycles.data}})

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
        dateMin: data.dateEnd,
        status: 'new',
        source: 'forecast',
        columns: project.mainDataset.columns,
        products: project.mainDataset.products,
        newProducts: project.mainDataset.newProducts,
        catalogItems: project.mainDataset.catalogItems,
        cycles: cycles.data,
        periods: periods,
        rule: project.rule._id
      })

      let forecast = await Forecast.create({
        catalogs: catalogs.data,
        engine: engine,
        project: project,
        forecastGroup: forecastGroup._id,
        dateEnd: data.dateEnd,
        dateStart: data.dateStart,
        dataset: dataset._id,
        cycles: cycles.data,
        instanceKey: v4()
      })
      console.log(engine)
      console.log(forecast)

      generateForecast.add({uuid: forecast.uuid})
      forecastGroup.forecasts.push(forecast._id)
    }

    await forecastGroup.save()

    ctx.body = forecastGroup
  }
})
