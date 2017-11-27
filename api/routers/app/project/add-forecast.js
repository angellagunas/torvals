const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Forecast} = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')
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
    ctx.assert(project, 404, 'Project not found')

    const forecastData = {
      dateStart: moment.utc(data.dateStart),
      dateEnd: moment.utc(data.dateEnd),
      frequency: data.frequency,
      holidays: data.holidays,
      changePoints: data.changePoints,
      project: project,
      datasets: project.datasets,
      organization: project.organization,
      createdBy: ctx.state.user
    }

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/configs_pr/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
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
        columns_for_forecast: ['date', 'analysis'],
        forecast_start: forecastData.dateStart.format('YYYY-MM-DD'),
        forecast_end: forecastData.dateEnd.format('YYYY-MM-DD'),
        frequency: forecastData.frequency,
        holidays: forecastData.holidays,
        change_points: forecastData.changePoints
      },
      json: true
    }

    let forecast

    try {
      var res = await request(options)

      forecast = await Forecast.create({
        ...forecastData,
        externalId: res._id,
        status: 'created'
      })
    } catch (e) {
      ctx.throw(401, 'Failed to create Forecast, check your internet connection')
    }

    ctx.body = {
      data: forecast.format()
    }
  }
})
