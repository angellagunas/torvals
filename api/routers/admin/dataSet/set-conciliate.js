const Route = require('lib/router/route')

const { DataSet } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/conciliate',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('project')

    ctx.assert(dataset, 404, 'DataSet not found')

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/conciliation/projects/${dataset.project.externalId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
        dataset_id: dataset.externalId
      },
      json: true,
      persist: true
    }

    try {
      var res = await request(options)

      if (res.status === 'error') {
        dataset.set({
          status: 'error',
          error: res.message
        })

        await dataset.save()

        ctx.body = {
          data: dataset
        }

        return
      }

      dataset.set({
        status: 'conciliated'
      })

      await dataset.save()
    } catch (e) {
      ctx.throw(401, 'Failed to send Dataset for conciliation')
    }

    let project = dataset.project

    project.status = 'adjustment'
    await project.save()

    ctx.body = {
      data: dataset
    }
  }
})
