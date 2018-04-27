const Route = require('lib/router/route')

const { Product, Channel, DataSet, Anomaly, SalesCenter, Project } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/list/:uuid',
  handler: async function (ctx) {
    var filters = {}
    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('activeDataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')
    ctx.assert(project.activeDataset, 404, 'No hay DataSet activo')
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
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        continue
      }

      if (filter === 'channel') {
        filters[filter] = await Channel.findOne({
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        continue
      }

      if (filter === 'salesCenter') {
        filters[filter] = await SalesCenter.findOne({
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
        continue
      }
      if (filter === 'category') {
        var products = await Product.find({
          'category': ctx.request.query[filter],
          organization: ctx.state.organization
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

    var rows = await Anomaly.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters, organization: ctx.state.organization},
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
