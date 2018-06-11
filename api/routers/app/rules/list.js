const Route = require('lib/router/route')
const { Rule } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    let filters = {}
    for (let filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    filters['organization'] = ctx.state.organization._id
    let rule = await Rule.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      sort: ctx.request.query.sort || 'priority',
      populate: ['organization']
    })

    rule.data = rule.data.map(item => {
      return item.toPublic()
    })

    ctx.body = rule
  }
})
