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
  path: '/counter/:uuid/',
  handler: async function (ctx) {
    let datasetId = ctx.params.uuid
    const catalogIds = ctx.request.query.catalogIds.split(',')  
    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      'organization': ctx.state.organization
    }).populate('rule')
    ctx.assert(dataset, 404, 'DataSet not found')

    let filters = {
      'dataset': ObjectId(dataset._id),
      'isDeleted': false,
      'status': 'created'
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

    const permissionsList = [
      'manager-level-1',
      'manager-level-2',
      'manager-level-3',
      'consultor-level-2',
      'consultor-level-3'
    ]
    if (permissionsList.includes(currentRole.slug)) {
      var catalogItems = await CatalogItem.filterByUserRole(
        { _id: {$in: catalogIds}, type: 'centro-de-venta'},
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$in': catalogItems }
    }
    let adjustmentRequests = await AdjustmentRequest.find(filters).populate('datasetRow')
    

    ctx.body = {
      data: {created: adjustmentRequests.length}
    }
  }
})
