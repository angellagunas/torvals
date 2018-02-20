const Route = require('lib/router/route')

const { DataSetRow, DataSet } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/modified/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')

    var filters = {}
    filters['dataset'] = dataset
    filters['status'] = 'adjusted'
    filters['organization'] = ctx.state.organization
    var modified = await DataSetRow.find({isDeleted: false, ...filters}).count()

    filters['status'] = 'sendingChanges'
    var pending = await DataSetRow.find({isDeleted: false, ...filters}).count()

    ctx.body = {
      data: {modified: modified, pending: pending}
    }
  }
})
