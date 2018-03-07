const Route = require('lib/router/route')

const { Product, Channel, DataSet, Anomaly, SalesCenter } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'semanaBimbo') {
        filters['semanaBimbo'] = ctx.request.query[filter]
        continue
      }

      if (filter === 'product') {
        filters[filter] = await Product.findOne({
          'uuid': ctx.request.query[filter]
        })
        continue
      }

      if (filter === 'channel') {
        filters[filter] = await Channel.findOne({
          'uuid': ctx.request.query[filter]
        })
        continue
      }

      if (filter === 'salesCenter') {
        filters[filter] = await SalesCenter.findOne({
          'uuid': ctx.request.query[filter]
        })
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

    var rows = await Anomaly.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['salesCenter', 'product', 'channel', 'dataset', 'organization']
    })

    rows.data = rows.data.map(item => {
      return item.toAdmin()
    })

    ctx.body = {
      data: rows.data
    }
  }
})
