const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {Project, Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'organization') {
        const org = await Organization.findOne({'uuid': ctx.request.query[filter]})

        if (org) {
          filters['organization'] = ObjectId(org._id)
        }

        continue
      }

      if (filter === 'showOnDashboard') {
        filters['$or'] = [{showOnDashboard: null}, {showOnDashboard: true}]
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }
    }

    var projects = await Project.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    ctx.body = projects
  }
})
