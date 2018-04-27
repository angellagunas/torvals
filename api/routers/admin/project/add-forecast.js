const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Forecast} = require('models')
const Api = require('lib/abraxas/api')
const moment = require('moment')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/forecast',
  validator: lov.object().keys({
    dateStart: lov.date().required(),
    dateEnd: lov.date().required()
  }),
  handler: async function (ctx) {
    const projectId = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': projectId}).populate('datasets.dataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    if (project.datasets.length === 0) {
      ctx.throw(401, 'Se necesitan agregar datasets al proyecto primero!')
    }

    const forecastData = {
      dateStart: moment.utc(data.dateStart),
      dateEnd: moment.utc(data.dateEnd),
      frequency: data.frequency,
      holidays: data.holidays,
      changePoints: data.changePoints,
      project: project,
      datasets: project.datasets,
      organization: project.organization,
      createdBy: ctx.state.user,
      columnsForForecast: data.columnsForForecast
    }

    let forecast
    const res = await Api.configForecast({
      project_id: project.uuid,
      datasets: forecastData.datasets.map(item => {
        return {
          _id: item.dataset.externalId,
          columns: item.columns.map(col => {
            return {
              'name_dataset': col.name_dataset,
              'name_project': col.name_project
            }
          })
        }
      }),
      columns_for_forecast: forecastData.columnsForForecast,
      forecast_start: forecastData.dateStart.format('YYYY-MM-DD'),
      forecast_end: forecastData.dateEnd.format('YYYY-MM-DD'),
      frequency: forecastData.frequency,
      holidays: forecastData.holidays,
      change_points: forecastData.changePoints
    })

    forecast = await Forecast.create({
      ...forecastData,
      configPrId: res._id,
      status: 'created'
    })

    ctx.body = {
      data: forecast.toAdmin()
    }
  }
})
