const Route = require('lib/router/route')

const { DataSetRow } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
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

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
      .populate(['organization', 'salesCenter', 'product', 'adjustmentRequest', 'channel'])
      .sort(ctx.request.query.sort || '-dateCreated')

    ctx.body = {
      data: rows
    }
  }
})
