const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Role, Forecast, PredictionHistoric} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    const user = await ctx.state.user.toPublic()
    var currentRole
    var currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }

    var filters = {}

    switch (currentRole.slug) {
      case 'analista':
        filters['status'] = 'analistReview'
        break
      case 'ops':
        filters['status'] = 'opsReview'
        break
      case 'supervisor':
        filters['status'] = 'supervisorReview'
        break
      case 'supervisor-ops':
        filters['status'] = 'opsReview'
        break
    }

    const forecasts = await Forecast.find({'isDeleted': false, ...filters})
    const predictions = await PredictionHistoric.find({
      updatedBy: ObjectId(ctx.state.user._id),
      organization: ObjectId(ctx.state.organization._id)
    }).limit(20)

    ctx.body = {
      forecasts: forecasts,
      forecastsCount: forecasts.length,
      predictions
    }
  }
})
