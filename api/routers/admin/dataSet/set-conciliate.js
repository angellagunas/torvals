const Route = require('lib/router/route')
const moment = require('moment')

const { DataSet } = require('models')

const Api = require('lib/abraxas/api')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/conciliate',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('project')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    const res = await Api.conciliateProject(dataset.project.externalId, dataset.externalId)

    if (res.status === 'error') {
      dataset.set({
        status: 'conciliated',
        conciliatedBy: ctx.state.user,
        dateConciliated: moment.utc()
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
    let project = dataset.project

    project.status = 'pendingRows'
    await project.save()

    ctx.body = {
      data: dataset
    }
  }
})
