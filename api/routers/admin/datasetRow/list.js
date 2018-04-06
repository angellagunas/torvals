const Route = require('lib/router/route')
const moment = require('moment')
const { DataSetRow, DataSet, Product, SalesCenter, Channel, AbraxasDate } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

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
          dateStart: { $lte: moment(dataset.dateMax) }
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

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
      .populate(['salesCenter', 'product', 'adjustmentRequest', 'channel'])
      .sort(ctx.request.query.sort || '-dateCreated')

    var auxRows = []
    for (var item of rows) {
      await item.product.populate('price').execPopulate()

      auxRows.push({
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
      })
    }

    ctx.body = {
      data: auxRows
    }
  }
})
