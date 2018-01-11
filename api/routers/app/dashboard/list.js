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
      case 'analyst':
        filters['status'] = 'analistReview'
        break
      case 'localmanager':
        filters['status'] = 'opsReview'
        break
      case 'enterprisemanager':
        filters['status'] = 'supervisorReview'
        break
      case 'opsmanager':
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
