const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Group, User, SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'user') {
        const user = await User.findOne({'uuid': ctx.request.query[filter]})

        if (user) {
          filters['users'] = { $nin: [ObjectId(user._id)] }
        }

        continue
      }

      if (filter === 'user_orgs') {
        const user = await User.findOne({'uuid': ctx.request.query[filter]})

        if (user) {
          filters['organization'] = { $in: user.organizations.map(item => { return item.organization }) }
        }

        continue
      }

      if (filter === 'salesCenter') {
        const salesCenter = await SalesCenter.findOne({'uuid': ctx.request.query[filter]}).populate('organization')

        if (salesCenter) {
          filters['organization'] = salesCenter.organization._id
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var groups = await Group.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      populate: 'organization',
      sort: ctx.request.query.sort || '-dateCreated'
    })

    ctx.body = groups
  }
})
