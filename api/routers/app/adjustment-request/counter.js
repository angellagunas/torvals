const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {DataSet, AdjustmentRequest, Role, SalesCenter, Channel} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/counter/:uuid/',
  handler: async function (ctx) {
    let datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      'organization': ctx.state.organization
    })
    ctx.assert(dataset, 404, 'DataSet not found')

    let filters = {
      'dataset': ObjectId(dataset._id),
      'isDeleted': false,
      'status': 'created'
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
      currentRole.slug === 'consultor'
    ) {
      var groups = user.groups
      var salesCenters = []

      salesCenters = await SalesCenter.find({
        groups: {$in: groups},
        organization: ctx.state.organization._id
      })

      filters['salesCenter'] = {$in: salesCenters}

      var channels = []

      channels = await Channel.find({
        groups: { $in: groups },
        organization: ctx.state.organization._id
      })

      filters['channel'] = {$in: channels}
    }

    let adjustmentRequests = await AdjustmentRequest.find(filters).count()

    adjustmentRequests.data = adjustmentRequests

    ctx.body = {
      data: {created: adjustmentRequests}
    }
  }
})
