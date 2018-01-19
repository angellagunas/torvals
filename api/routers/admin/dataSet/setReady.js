const Route = require('lib/router/route')

const { DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/ready',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('project')

    ctx.assert(dataset, 404, 'DataSet not found')

    dataset.set({
      status: 'ready'
    })
    await dataset.save()

    // TODO: consolidate dataset (API call)

    if (dataset.project) {
      let project = dataset.project

      if (project.status === 'empty') {
        project.status = 'ready'

        await project.save()
      }
    }

    ctx.body = {
      data: dataset
    }
  }
})
