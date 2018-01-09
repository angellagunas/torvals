const Route = require('lib/router/route')
const ObjectId = require('mongodb').ObjectID
const {SalesCenter, Role, Forecast, Prediction} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
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

      if (currentRole.slug === 'ops' || currentRole.slug === 'supervisor-ops') {
        var groups = user.groups
        var salesCentersList = []

        salesCentersList = await SalesCenter.find({groups: {$in: groups}})

        filters['salesCenters'] = {$in: salesCentersList}
      }

      if (filter === 'predictions') {
        const forecast = await Forecast.findOne({'uuid': ctx.request.query[filter]})

        if (forecast) {
          const predictions = await Prediction.find({'forecast': ObjectId(forecast._id)}).populate('salesCenter')

          filters['_id'] = { $in: predictions.map(item => { return item.salesCenter._id }) }
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }
    }

    var salesCenters = await SalesCenter.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false, organization: ctx.state.organization._id},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    ctx.body = salesCenters
  }
})
