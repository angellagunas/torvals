const Route = require('lib/router/route')

const { DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/configure',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')

    dataset.set({
      status: 'configuring'
    })
    await dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})
