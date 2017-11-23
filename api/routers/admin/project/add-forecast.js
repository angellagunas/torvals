const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Forecast} = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

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

    const project = await Project.findOne({'uuid': projectId}).populate('datasets')
    ctx.assert(project, 404, 'Project not found')

    const forecastData = {
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      frequency: data.frequency,
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
            _id: item.externalId,
            columns: {
              name_dataset: 'Holi',
              name_project: 'Holi'
            }
          }
        }),
        columns_for_forecast: ['date', 'analysis'],
        forecast_start: forecastData.dateStart,
        forecast_end: forecastData.dateEnd,
        frequency: forecastData.frequency,
        holidays: [
          {date: '2017-12-02', name: 'Test holiday'}
        ],
        change_points: []
      },
      json: true
    }

    let forecast

    try {
      var res = await request(options)
      console.log(res)
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
