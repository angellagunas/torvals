const Route = require('lib/router/route')
const {Role} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'general') {
        delete filters['general']
        if (ctx.request.query[filter] !== '') {
          filters['name'] = { '$regex': ctx.request.query[filter], '$options': 'i' }
        }
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var role = await Role.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      sort: ctx.request.query.sort || 'priority',
      format: 'toAdmin'
    })

    ctx.body = role
  }
})
