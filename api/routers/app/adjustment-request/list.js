const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const moment = require('moment')
const _ = require('lodash')

const {
  AdjustmentRequest,
  CatalogItem,
  Cycle,
  DataSet,
  Role
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      'organization': ctx.state.organization
    }).populate('rule')

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

    let catalogItemsFilters = []
    let filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      var isCatalog = catalogs.find(item => {
        return item === filter
      })

      if (isCatalog) {
        const cItem = await CatalogItem.findOne({uuid: ctx.request.query[filter]})
        catalogItemsFilters.push(cItem.id)
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    const user = ctx.state.user
    let currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (catalogItemsFilters.length > 0) {
      let groups = ctx.state.user.groups.map((item) => {return Object(item)})
      let catalogItems = await CatalogItem.filterByUserRole(
        {
          _id: { $in: catalogItemsFilters },
          type: { $ne: 'canal'},
          groups: { $in: groups }
        },
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$in': catalogItems }
    }

    const permissionsList = [
      'manager-level-1',
      'manager-level-2',
      'manager-level-3',
      'consultor-level-2',
      'consultor-level-3'
    ]
    if (permissionsList.includes(currentRole.slug)) {
      if (catalogItemsFilters.length === 0) {
        let groups = ctx.state.user.groups.map((item) => {return Object(item)})
        let catalogItems = await CatalogItem.filterByUserRole(
          {
            type: { $ne: 'canal'},
            groups: { $in: groups }
          },
          currentRole.slug,
          user
        )
        filters['catalogItems'] = { '$in': catalogItems }
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
        'newProduct',
        'catalogItems',
        'datasetRow',
        'period',
        'cycle'
      ],
      sort: ctx.request.query.sort || '-dateCreated'
    })
    
    adjustmentRequests.data = adjustmentRequests.data.map(item => {
      return {
        ...item.toPublic(),
        product: item.newProduct,
        requestedBy: item.requestedBy.toPublic(),
        approvedBy: item.approvedBy ? item.approvedBy.toPublic() : undefined,
        rejectedBy: item.rejectedBy ? item.rejectedBy.toPublic() : undefined
      }
    })
    ctx.body = adjustmentRequests
  }
})
