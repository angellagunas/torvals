const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {
  Role,
  Forecast,
  PredictionHistoric,
  User,
  Group,
  Product,
  SalesCenter,
  Project
} = require('models')

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
    var response = {}

    switch (currentRole.slug) {
      case 'analyst':
        filters['status'] = 'analistReview'
        response = {
          productCount: await Product.find({'organization': {$in: [ObjectId(currentOrganization.organization._id)]}, 'isDeleted': false}).count(),

          salesCenterCount: await SalesCenter.find({'organization': {$in: [ObjectId(currentOrganization.organization._id)]}, 'isDeleted': false}).count()
        }
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

      case 'orgadmin':
        response = {
          usersCount: await User.find({'organizations.organization': {$in: [ObjectId(currentOrganization.organization._id)]}, 'isDeleted': false}).count(),

          groupsCount: await Group.find({'organization': {$in: [ObjectId(currentOrganization.organization._id)]}, 'isDeleted': false}).count()
        }
        break
    }

    response = {
      ...response,
      project: await Project.find().sort('-dateCreated').limit(1),
      forecasts: await Forecast.find({'organization': {$in: [ObjectId(currentOrganization.organization._id)]}, 'isDeleted': false, ...filters}),
      predictions: await PredictionHistoric.find({
        updatedBy: ObjectId(ctx.state.user._id),
        organization: ObjectId(ctx.state.organization._id)
      }).limit(20)
    }

    ctx.body = response
  }
})
