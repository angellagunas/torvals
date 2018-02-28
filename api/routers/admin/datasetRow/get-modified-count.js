const Route = require('lib/router/route')

const { DataSetRow, DataSet } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/modified/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    var filters = {}
    filters['dataset'] = dataset
    filters['status'] = 'adjusted'
    var modified = await DataSetRow.find({isDeleted: false, ...filters}).count()

    filters['status'] = 'sendingChanges'
    var pending = await DataSetRow.find({isDeleted: false, ...filters}).count()

    ctx.body = {
      data: {modified: modified, pending: pending}
    }
  }
})
