const Route = require('lib/router/route')

const { DataSetRow, DataSet, Product, SalesCenter, Channel } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    })

    ctx.assert(dataset, 404, 'DataSet not found')

    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'semanaBimbo') {
        filters['data.semanaBimbo'] = ctx.request.query[filter]
        continue
      }

      if (filter === 'product') {
        filters[filter] = await Product.findOne({
          'uuid': ctx.request.query[filter],
          organization: dataset.organization
        })
        continue
      }

      if (filter === 'channel') {
        filters[filter] = await Channel.findOne({
          'uuid': ctx.request.query[filter],
          organization: dataset.organization
        })
        continue
      }

      if (filter === 'salesCenter') {
        filters[filter] = await SalesCenter.findOne({
          'uuid': ctx.request.query[filter],
          organization: dataset.organization
        })
        continue
      }

      if (filter === 'category') {
        var products = await Product.find({
          'category': ctx.request.query[filter],
          organization: dataset.organization
        })
        filters['product'] = { $in: products.map(item => { return item._id }) }
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    filters['dataset'] = dataset

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
      .populate(['organization', 'salesCenter', 'product', 'adjustmentRequest', 'channel'])
      .sort(ctx.request.query.sort || '-dateCreated')

    ctx.body = {
      data: rows
    }
  }
})
