const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {DataSet, AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/counter/:uuid/',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')
    const adjustmentRequests = await AdjustmentRequest.find({
      'dataset': ObjectId(dataset._id),
      'isDeleted': false,
      'status': 'created'
    }).count()

    adjustmentRequests.data = adjustmentRequests
    ctx.body = {
      data: {created: adjustmentRequests}
    }
  }
})
