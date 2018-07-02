const Route = require('lib/router/route')
const {Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'showOnDashboard') {
        filters['$or'] = [{showOnDashboard: null}, {showOnDashboard: true}]
        continue
      }

      if (filter === 'outdated') {
        filters['outdated'] = false
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }

      if (filter === 'general') {
        delete filters['general']
        if (ctx.request.query[filter] !== '') {
          filters['name'] = { '$regex': ctx.request.query[filter], '$options': 'i' }
        }
        continue
      }
    }

    var projects = await Project.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false, organization: ctx.state.organization._id},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['organization', 'mainDataset']
    })

    ctx.body = projects
  }
})
