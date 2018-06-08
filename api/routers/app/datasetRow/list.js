const Route = require('lib/router/route')
const moment = require('moment')
const {
  DataSetRow,
  DataSet,
  Product,
  SalesCenter,
  Channel,
  Role,
  AbraxasDate,
  Price
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

      /* if (filter === 'semanaBimbo') {
        filters['data.semanaBimbo'] = ctx.request.query[filter]
        continue
      } */

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

      if (filter === 'period') {
        const weeks = await AbraxasDate.find({
          month: ctx.request.query[filter],
          dateStart: {$lte: moment.utc(dataset.dateMax), $gte: moment.utc(dataset.dateMin).subtract(1, 'days')}
        }).sort('dateStart')

        filters['data.semanaBimbo'] = { $in: weeks.map(item => { return item.week }) }
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    filters['dataset'] = dataset._id

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
      currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2' ||
      currentRole.slug === 'supervisor'
    ) {
      var groups = user.groups
      if (!filters['salesCenter']) {
        var salesCenters = []

        salesCenters = await SalesCenter.find({
          groups: {$in: groups},
          organization: ctx.state.organization._id
        })

        filters['salesCenter'] = {$in: salesCenters}
      }

      if (!filters['channel']) {
        var channels = []

        channels = await Channel.find({
          groups: { $in: groups },
          organization: ctx.state.organization._id
        })

        filters['channel'] = {$in: channels}
      }
    }

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
    .populate(['salesCenter', 'adjustmentRequest', 'channel'])
    .sort(ctx.request.query.sort || '-dateCreated')

    const AllPrices = await Price.find({'organization': ctx.state.organization._id})
    var prices = {}
    for (let price of AllPrices) {
      prices[price._id] = price.price
    }

    const AllProducts = await Product.find({'organization': ctx.state.organization._id})
    var productsArr = []
    for (let product of AllProducts) {
      productsArr[product._id] = {'name': product.name, 'externalId': product.externalId}
    }

    var auxRows = []
    for (var item of rows) {
      auxRows.push({
        uuid: item.uuid,
        salesCenter: item.salesCenter ? item.salesCenter.name : '',
        productId: productsArr[item.product] ? productsArr[item.product].externalId : '',
        productName: productsArr[item.product] ? productsArr[item.product].name : '',
        productPrice: prices[item.product.price] || '',
        channel: item.channel ? item.channel.name : '',
        channelId: item.channel ? item.channel.externalId : '',
        semanaBimbo: item.data.semanaBimbo,
        prediction: item.data.prediction,
        adjustment: item.data.adjustment,
        localAdjustment: item.data.localAdjustment,
        lastAdjustment: item.data.lastAdjustment,
        adjustmentRequest: item.adjustmentRequest,
        externalId: item.externalId
      })
    }

    ctx.body = {
      data: auxRows
    }
  }
})
