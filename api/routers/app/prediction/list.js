const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Forecast, Prediction, SalesCenter, Role} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'forecast') {
        const forecast = await Forecast.findOne({'uuid': ctx.request.query[filter]})

        if (forecast) {
          filters['forecast'] = ObjectId(forecast._id)
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    filters['organization'] = ctx.state.organization

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (currentRole.slug === 'localmanager') {
      var groups = user.groups
      var salesCenters = []

      salesCenters = await SalesCenter.find({groups: {$in: groups}})

      filters['salesCenter'] = {$in: salesCenters}
    }

    var predictions = await Prediction.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      populate: ['organization', 'salesCenter', 'product'],
      sort: ctx.request.query.sort || '-dateCreated'
    })

    ctx.body = predictions
  }
})
