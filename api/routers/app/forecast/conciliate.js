const Route = require('lib/router/route')
const conciliateToProject = require('queues/conciliate-to-project')
const moment = require('moment')

const {Forecast, Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/conciliate/:uuid',
  handler: async function (ctx) {
    var forecastId = ctx.params.uuid

    const forecast = await Forecast.findOne({'uuid': forecastId, 'isDeleted': false})
      .populate('dataset forecastGroup')
    ctx.assert(forecast, 404, 'Forecast no encontrado')

    const project = await Project.findOne({_id: forecast.dataset.project})
    ctx.assert(project, 404, 'Proyecto no encontrado')

    forecast.set({
      status: 'conciliatingPrediction'
    })
    await forecast.save()

    forecast.dataset.set({
      status: 'conciliating',
      conciliatedBy: ctx.state.user,
      dateConciliated: moment.utc()
    })
    await forecast.dataset.save()

    project.set({
      status: 'conciliatingForecast'
    })
    await project.save()

    await conciliateToProject.add({project: project.uuid, dataset: forecast.dataset.uuid})

    project.set({
      hasForecast: true,
      cycleStatus: (project.cycleStatus === 'forecastCreation') ? 'rangeAdjustment' : project.cycleStatus
    })
    await project.save()

    forecast.forecastGroup.set({
      status: 'conciliated'
    })
    await forecast.forecastGroup.save()

    forecast.set({
      status: 'conciliated'
    })
    await forecast.save()

    ctx.body = {
      data: forecast.toPublic()
    }
  }
})
