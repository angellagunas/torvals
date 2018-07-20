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

    if (!project.mainDataset) {
      ctx.throw(422, 'El proyecto no tiene un dataset principal')
    }

    if ((data.engines && data.engines.length < 1) || (!data.engines)) {
      ctx.throw(422, 'Debes seleccionar por lo menos un modelo de predicciones')
    }

    let catalogs
    let cycles
    if (data.type === 'compatible') {
      catalogs = {data: project.rule.catalogs}

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
      cycles = {
        data: cyclesAvailable,
        ids: cyclesAvailable.map(item => { return item._id })
      }
    } else {
      catalogs = await Catalog.find({uuid: {$in: data.catalogs}})
      catalogs.data = catalogs.map(item => {
        return item._id
      })

      cycles = await Cycle.getBetweenDates(project.organization, project.rule._id, data.dateStart, data.dateEnd)
      cycles = {
        data: cycles,
        ids: cycles.map(item => { return item._id })
      }
    }

    let cyclesSorted = cycles.data.sort((a, b) => {
      return moment.utc(a.startDate, 'YYYY-MM-DD').isBefore(moment.utc(b.startDate))
    })

    let periods = await Period.find({cycle: {$in: cycles.data}})

    let engines = await Engine.find({uuid: {$in: data.engines}})
    engines.data = engines.map(item => {
      return item._id
    })

    let forecastGroup = await ForecastGroup.create({
      project: project._id,
      alias: data.alias,
      catalogs: catalogs.data,
      cycles: cycles.ids,
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
        dateMax: moment.utc(cyclesSorted[cyclesSorted.length - 1].dateEnd).format('YYYY-MM-DD'),
        dateMin: moment.utc(cyclesSorted[0].dateStart).format('YYYY-MM-DD'),
        status: 'new',
        source: 'forecast',
        columns: project.mainDataset.columns,
        products: project.mainDataset.products,
        newProducts: project.mainDataset.newProducts,
        catalogItems: project.mainDataset.catalogItems,
        cycles: cycles.ids,
        periods: periods,
        rule: project.rule._id
      })

      let forecast = await Forecast.create({
        catalogs: catalogs.data,
        engine: engine,
        project: project,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(cyclesSorted[cyclesSorted.length - 1].dateEnd),
        dateStart: moment.utc(cyclesSorted[0].dateStart),
        dataset: dataset._id,
        cycles: cycles.ids,
        instanceKey: v4()
      })

      generateForecast.add({uuid: forecast.uuid})
      forecastGroup.forecasts.push(forecast._id)
    }

    await forecastGroup.save()

    ctx.body = forecastGroup
  }
})
