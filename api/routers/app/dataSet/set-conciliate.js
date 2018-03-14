const Route = require('lib/router/route')
const moment = require('moment')

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

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    try {
      var apiData = Api.get()
      if (!apiData.token) {
        await Api.fetch()
        apiData = Api.get()
      }
    } catch (e) {
      ctx.throw(503, 'Abraxas API no disponible para la conexión')
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
        status: 'conciliated',
        conciliatedBy: ctx.state.user,
        dateConciliated: moment.utc()
      })

      await dataset.save()
    } catch (e) {
      let errorString = []
      errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      ctx.throw(503, 'Abraxas API: ' + (errorString[1] || 'No está disponible'))

      return false
    }

    let project = dataset.project

    project.status = 'pendingRows'
    await project.save()

    ctx.body = {
      data: dataset
    }
  }
})
