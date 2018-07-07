const Route = require('lib/router/route')
const {ForecastGroup} = require('models')

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
      sort: ctx.request.query.sort || '-dateCreated'
    })

    forecast.data = forecast.data.map(item => {
      return item.toPublic()
    })
    ctx.body = forecast.data
  }
})
