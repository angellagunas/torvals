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
      if (filter === 'general') {
        let $or = []
        if (!isNaN(ctx.request.query[filter])) {
          $or.push({prediction: ctx.request.query[filter]})
        }

        let channelValues = []
        let channel = await Channel.find({
          name: new RegExp(ctx.request.query[filter], 'i'),
          isDeleted: false,
          organization: ctx.state.organization
        })
        channel.map(channel => {
          channelValues.push(channel._id)
        })
        if (channelValues.length) {
          $or.push({channel: {$in: channelValues}})
        }

        let productValues = []
        let product = await Product.find({
          '$or': [
            {name: new RegExp(ctx.request.query[filter], 'i')},
            {externalId: new RegExp(ctx.request.query[filter], 'i')}
          ],
          isDeleted: false,
          organization: ctx.state.organization
        })

        product.map(product => {
          productValues.push(product._id)
        })

        if (productValues.length) {
          $or.push({product: {$in: productValues}})
        }

        let salesCenterValues = []
        let salesCenter = await Product.find({
          '$or': [
            {name: new RegExp(ctx.request.query[filter], 'i')},
            {externalId: new RegExp(ctx.request.query[filter], 'i')}
          ],
          isDeleted: false,
          organization: ctx.state.organization
        })
        salesCenter.map(saleCenter => {
          salesCenterValues.push(saleCenter._id)
        })
        if (salesCenterValues.length) {
          $or.push({salesCenter: {$in: salesCenterValues}})
        }
        if ($or.length) { filters['$or'] = $or }
      } else {
        if (!isNaN(parseInt(ctx.request.query[filter]))) {
          filters[filter] = parseInt(ctx.request.query[filter])
        } else {
          filters[filter] = ctx.request.query[filter]
        }
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
