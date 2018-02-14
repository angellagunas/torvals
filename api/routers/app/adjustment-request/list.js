const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {DataSet, AdjustmentRequest, SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      'organization': ctx.state.organization
    })

    ctx.assert(dataset, 404, 'DataSet not found')

    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'salesCenter') {
        const salesCenter = await SalesCenter.findOne({'uuid': ctx.request.query[filter]})

        if (salesCenter) {
          filters['salesCenter'] = ObjectId(salesCenter._id)
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var adjustmentRequests = await AdjustmentRequest.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false, dataset: dataset},
      populate: [
        'requestedBy',
        'approvedBy',
        'rejectedBy',
        {path: 'datasetRow', populate: ['product', 'salesCenter']}
      ],
      sort: ctx.request.query.sort || '-dateCreated'
    })

    adjustmentRequests.data = adjustmentRequests.data.map(item => {
      return {
        ...item.format(),
        requestedBy: item.requestedBy.format(),
        approvedBy: item.approvedBy ? item.approvedBy.format() : undefined,
        rejectedBy: item.rejectedBy ? item.rejectedBy.format() : undefined,
        datasetRow: item.datasetRow.format()
      }
    })

    ctx.body = adjustmentRequests
  }
})
