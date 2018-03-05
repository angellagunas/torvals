const Route = require('lib/router/route')

const { AbraxasDate, Organization } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'week') {
        if (!isNaN(parseInt(ctx.request.query[filter]))) {
          filters['week'] = parseInt(ctx.request.query[filter])
        } else {
          ctx.throw(400, 'La semana debe ser un número!')
        }
        continue
      }

      if (filter === 'organization') {
        filters[filter] = await Organization.findOne({
          'uuid': ctx.request.query[filter]
        })
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var dates = await AbraxasDate.find({isDeleted: false, ...filters})
      .sort(ctx.request.query.sort || '-dateStart')

    dates = dates.map(item => {
      return item.toPublic()
    })

    ctx.body = {
      data: dates
    }
  }
})
