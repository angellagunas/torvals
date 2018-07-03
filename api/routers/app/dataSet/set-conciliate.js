const Route = require('lib/router/route')
const moment = require('moment')

const { DataSet } = require('models')
const conciliateToProject = require('queues/conciliate-to-project')
const generateDownload = require('queues/generate-downloads')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/conciliate',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('project')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    await generateDownload.add({uuid: dataset.uuid})

    dataset.set({
      status: 'conciliating',
      conciliatedBy: ctx.state.user,
      dateConciliated: moment.utc()
    })

    await dataset.save()

    dataset.project.set({
      status: 'conciliating'
    })

    await dataset.project.save()

    conciliateToProject.add({project: dataset.project.uuid, dataset: dataset.uuid})

    ctx.body = {
      data: dataset
    }
  }
})
