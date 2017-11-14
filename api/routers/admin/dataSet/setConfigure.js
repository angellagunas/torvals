const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/configure',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')

    // Clearing past configs
    for (var col of dataset.columns) {
      col.isDate = false
      col.analyze = false
      col.isAnalysisFilter = false
      col.isOperationFilter = false
    }

    dataset.set({
      status: 'configuring'
    })
    await dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})
