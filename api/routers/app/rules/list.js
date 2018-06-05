const Route = require('lib/router/route')
const { Rule } = require('models')
const ObjectId = require('mongodb').ObjectID
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
        filters[filter] = ctx.request.query[filter]
      }
    }

    filters['organization'] = ObjectId('5ae22fc26f556e0022546354')// ctx.state.organization._id
    console.log(filters)
    var rule = await Rule.dataTables({
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
