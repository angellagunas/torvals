const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {DataSet, AdjustmentRequest, SalesCenter, Channel, Role} = require('models')

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

    let statement = [{
      $match: {
        uuid: dataset.uuid
      }
    },
    {
      $lookup: {
        from: 'catalogitems',
        localField: 'catalogItems',
        foreignField: '_id',
        as: 'catalogs'
      }
    },
    {
      $unwind: {
        path: '$catalogs'
      }
    },
    {
      $group: {
        _id: null,
        catalogs: {
          $addToSet: '$catalogs.type'
        }
      }
    }]

    let catalogs = await DataSet.aggregate(statement)
    if (catalogs) { catalogs = catalogs[0].catalogs }

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

      var isCatalog = catalogs.find(item => {
        return item === filter
      })

      if (isCatalog) {
        filters['catalogItems'] = ObjectId(ctx.request.query[filter])
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (
      currentRole.slug === 'consultor-level-3'
    ) {
      var groups = user.groups
      if (!filters['salesCenter']) {
        var salesCenters = []

        salesCenters = await SalesCenter.find({
          groups: {$in: groups},
          organization: ctx.state.organization._id
        })

        filters['salesCenter'] = {$in: salesCenters}
      }

      if (!filters['channel']) {
        var channels = []

        channels = await Channel.find({
          groups: { $in: groups },
          organization: ctx.state.organization._id
        })

        filters['channel'] = {$in: channels}
      }
    }

    var adjustmentRequests = await AdjustmentRequest.dataTables({
      limit: ctx.request.query.limit || 0,
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
        ...item.toPublic(),
        requestedBy: item.requestedBy.toPublic(),
        approvedBy: item.approvedBy ? item.approvedBy.toPublic() : undefined,
        rejectedBy: item.rejectedBy ? item.rejectedBy.toPublic() : undefined,
        datasetRow: item.datasetRow.toPublic()
      }
    })

    ctx.body = adjustmentRequests
  }
})
