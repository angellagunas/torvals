const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Organization, User, PredictionHistoric} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'name') {
        const user = await User.findOne({
          name: { '$regex': ctx.request.query[filter], '$options': 'i' }
        })

        if (user) {
          filters['updatedBy'] = ObjectId(user._id)
        }

        continue
      }

      if (filter === 'organization') {
        const organization = await Organization.findOne(
          {'uuid': ctx.request.query[filter]}
        )

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

    var predictions = await PredictionHistoric.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: filters,
      populate: ['organization', 'updatedBy'],
      sort: ctx.request.query.sort || '-dateCreated'
    })

    ctx.body = predictions
  }
})
