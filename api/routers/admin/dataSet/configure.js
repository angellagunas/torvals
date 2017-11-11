const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet } = require('models')
const Api = require('lib/abraxas/api')
const request = require('request-promise-native')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/configure',
  validator: lov.object().keys({
    isDate: lov.string().required(),
    analyze: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')

    var pos = dataset.columns.findIndex(e => {
      return (
        String(e.name) === String(body.isDate)
      )
    })

    dataset.columns[pos].isDate = true

    var pos2 = dataset.columns.findIndex(e => {
      return (
        String(e.name) === String(body.analyze)
      )
    })

    dataset.columns[pos2].analyze = true
    await dataset.save()

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/process/datasets/${dataset.externalId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
        idDate: body.isDate,
        isAnalysis: body.analyze,
        filterAnalysis: [],
        filterOperations: []
      },
      json: true
    }

    console.log(options)
    // try
      // var res = await request(options)
    dataset.set({
      status: 'processing'
    })
    await dataset.save()
    // } catch (e) {
    //   ctx.throw(401, 'Failed to send Dataset for processing')
    // }

    setTimeout(() => {
      dataset.set({
        status: 'reviewing'
      })
      dataset.save()
    }, 60000)

    ctx.body = {
      data: dataset
    }
  }
})
