const Route = require('lib/router/route')
const lov = require('lov')

const { Project, DataSet, SalesCenter, Product, Channel, DataSetRow } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

module.exports = new Route({
  method: 'post',
  path: '/filter/:uuid',
  // validator: lov.object().keys({
  //   name: lov.string().required(),
  //   organization: lov.string().required(),
  //   adjustment: lov.string().required()
  // }),
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body
    let dataset, org

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false})
      .populate('organization')

    ctx.assert(project, 404, 'Project not found')
    org = project.organization

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/filter/projects/${project.externalId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
        filter_date_ini: '2018-01-04',
        filter_date_end: '2018-02-04',
        period: '',
        frequency: ''
      },
      json: true,
      persist: true
    }

    try {
      var res = await request(options)

      dataset = await DataSet.create({
        name: 'New Filtered',
        organization: org._id,
        createdBy: ctx.state.user,
        project: project._id,
        externalId: res._id,
        status: 'reviewing'
      })

      project.datasets.push({
        dataset: dataset,
        columns: []
      })

      await project.save()
    } catch (e) {
      ctx.throw(401, "Couldn't filter project!")
    }

    options = {
      url: `${apiData.hostname}${apiData.baseUrl}/rows/datasets/${dataset.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {},
      json: true,
      persist: true
    }

    try {
      res = await request(options)

      for (var d of res._items) {
        var salesCenter = await SalesCenter.findOne({
          externalId: d.agency_id,
          organization: dataset.organization
        })
        var product = await Product.findOne({
          externalId: d.product_id,
          organization: dataset.organization
        })

        var channel = await Channel.findOne({
          externalId: d.product_id,
          organization: dataset.organization
        })

        if (!product) {
          product = await Product.create({
            name: 'Not identified',
            externalId: d.product_id,
            organization: dataset.organization
          })
        }

        if (!salesCenter) {
          salesCenter = await SalesCenter.create({
            name: 'Not identified',
            externalId: d.agency_id,
            organization: dataset.organization
          })
        }

        if (!channel) {
          channel = await Channel.create({
            name: 'Not identified',
            externalId: d.channel_id,
            organization: dataset.organization
          })
        }

        await DataSetRow.create({
          organization: dataset.organization,
          project: dataset.project,
          dataset: dataset,
          externalId: dataset.externalId,
          data: {
            ...d,
            semanaBimbo: d.semana_bimbo,
            forecastDate: d.forecast_date,
            adjustment: d.prediction,
            channelId: d.channel_id,
            channelName: d.channel_name
          },
          apiData: d,
          salesCenter: salesCenter,
          product: product,
          channel: channel
        })
      }
    } catch (e) {
      ctx.throw(401, "Couldn't obtain dataset rows!")
    }

    ctx.body = {
      data: project.toPublic()
    }
  }
})
