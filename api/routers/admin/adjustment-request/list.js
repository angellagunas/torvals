const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {DataSet, AdjustmentRequest, Organization, SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet no encontrado')

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

      if (filter === 'organization') {
        const organization = await Organization.findOne({'uuid': ctx.request.query[filter]})

        if (organization) {
          filters['organization'] = ObjectId(organization._id)
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
        ...item.toAdmin(),
        requestedBy: item.requestedBy.toAdmin(),
        approvedBy: item.approvedBy ? item.approvedBy.toAdmin() : undefined,
        rejectedBy: item.rejectedBy ? item.rejectedBy.toAdmin() : undefined,
        datasetRow: item.datasetRow.toAdmin()
      }
    })

    ctx.body = adjustmentRequests
  }
})
