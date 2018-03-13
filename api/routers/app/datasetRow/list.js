const Route = require('lib/router/route')

const {
  DataSetRow,
  DataSet,
  Product,
  SalesCenter,
  Channel,
  Role
} = require('models')

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

    ctx.assert(dataset, 404, 'DataSet no encontrado')

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

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (
      (currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2') &&
      !filters['salesCenter']
    ) {
      var groups = user.groups
      var salesCenters = []

      salesCenters = await SalesCenter.find({groups: {$in: groups}})

      filters['salesCenter'] = {$in: salesCenters}
    }

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
      .populate(['organization', 'salesCenter', 'product', 'adjustmentRequest', 'channel'])
      .sort(ctx.request.query.sort || '-dateCreated')

    rows = rows.map((item) => {
      // item.product.populate('price').execPopulate()

      return {
        uuid: item.uuid,
        salesCenter: item.salesCenter ? item.salesCenter.name : '',
        productId: item.product ? item.product.externalId : '',
        productName: item.product ? item.product.name : '',
        productPrice: item.product && item.product.price ? item.product.price.price : 10.00,
        channel: item.channel ? item.channel.name : '',
        semanaBimbo: item.data.semanaBimbo,
        prediction: item.data.prediction,
        adjustment: item.data.adjustment,
        localAdjustment: item.data.localAdjustment,
        lastAdjustment: item.data.lastAdjustment,
        adjustmentRequest: item.adjustmentRequest
      }
    })

    ctx.body = {
      data: rows
    }
  }
})
