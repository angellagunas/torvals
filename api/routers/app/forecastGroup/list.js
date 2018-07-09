const Route = require('lib/router/route')
const {ForecastGroup, Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
      }

      if (filter === 'project') {
        let project = await Project.findOne({uuid: ctx.request.query[filter]})
        if (project) { filters['project'] = project._id }
        continue
      }

      if (filter === 'general') {
        delete filters['general']
        if (ctx.request.query[filter] !== '') {
          filters['name'] = { '$regex': ctx.request.query[filter], '$options': 'i' }
        }
        continue
      }
    }

    var forecast = await ForecastGroup.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false},
      sort: ctx.request.query.sort || '-dateCreated',
      format: 'toPublic'
    })

    ctx.body = forecast
  }
})
