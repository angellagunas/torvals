const Route = require('lib/router/route')
const moment = require('moment')
const { Project, DataSetRow, Product, Channel, SalesCenter } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/local/table',
  handler: async function (ctx) {
    var data = ctx.request.body
    var filters = {
      organization: ctx.state.organization,
      activeDataset: {$ne: undefined}
    }

    if (data.projects && data.projects.length > 0) {
      filters['uuid'] = {$in: data.projects}
    }

    const projects = await Project.find(filters)
    const datasets = projects.map(item => { return item.activeDataset })

    const key = {product: '$product'}

    var match = [
      {
        '$match': {
          dataset: { $in: datasets }
        }
      }
    ]

    if (data.channels) {
      const channels = await Channel.find({ uuid: { $in: data.channels } }).select({'_id': 1})
      match.push({'$match': {'channel': {$in: channels.map(item => { return item._id })}}})
    }

    if (data.salesCenters) {
      const salesCenters = await SalesCenter.find({ uuid: { $in: data.salesCenters } }).select({'_id': 1})
      match.push({'$match': {'salesCenter': {$in: salesCenters.map(item => { return item._id })}}})
    }

    if (data.products) {
      const products = await Product.find({ uuid: { $in: data.products } }).select({'_id': 1})
      match.push({'$match': {'product': {$in: products.map(item => { return item._id })}}})
    }

    var matchPreviousSale = Array.from(match)

    if (data.date_start && data.date_end) {
      match.push({
        '$match': {
          'data.forecastDate': {
            $gte: moment.utc(data.date_start, 'YYYY-MM-DD').toDate(),
            $lte: moment.utc(data.date_end, 'YYYY-MM-DD').toDate()
          }
        }
      })
      matchPreviousSale.push({
        '$match': {
          'data.forecastDate': {
            $gte: moment.utc(data.date_start, 'YYYY-MM-DD').subtract(1, 'years').toDate(),
            $lte: moment.utc(data.date_end, 'YYYY-MM-DD').subtract(1, 'years').toDate()
          }
        }
      })
    } else {
      ctx.throw(400, 'Es necesario filtrarlo por un rango de fechas!')
    }

    var matchSaleOnly = Array.from(match)
    matchSaleOnly.push({
      '$match': {
        'data.sale': {'$gt': 0}
      }
    })

    match.push({
      '$match': {
        'data.sale': 0
      }
    })

    match.push({
      '$group': {
        _id: key,
        prediction: { $sum: '$data.prediction' },
        adjustment: { $sum: '$data.adjustment' },
        sale: { $sum: '$data.sale' }
      }
    })

    matchSaleOnly.push({
      '$group': {
        _id: key,
        prediction: { $sum: '$data.prediction' },
        adjustment: { $sum: '$data.adjustment' },
        sale: { $sum: '$data.sale' }
      }
    })

    matchPreviousSale.push({
      '$group': {
        _id: key,
        sale: { $sum: '$data.sale' }
      }
    })

    var noSales = await DataSetRow.aggregate(match)
    var sale = await DataSetRow.aggregate(matchSaleOnly)
    var previousSale = await DataSetRow.aggregate(matchPreviousSale)

    var previousSaleDict = {}
    previousSale.map(item => { previousSaleDict[item._id.product] = item })

    var saleDict = {}
    sale.map(item => { saleDict[item._id.product] = item })

    var products = noSales.map(item => { return item._id.product })
    products = await Product.find({_id: {$in: products}})

    var productsHash = {}
    products.map(item => {
      productsHash[item._id] = item.toPublic()
    })

    var responseData = noSales.map(item => {
      let product = item._id.product
      let sales = saleDict[product]
      let mape = 0
      let prediction = 0
      let adjustment = 0
      let sale = 0

      if (sales) {
        prediction = sales.prediction
        adjustment = sales.adjustment
        sale = sales.sale

        mape = Math.abs((sale - prediction) / sale) * 100
      }

      return {
        product: productsHash[product],
        prediction: item.prediction + prediction,
        adjustment: item.adjustment + adjustment,
        sale: item.sale + sale,
        previousSale: previousSaleDict[product] ? previousSaleDict[product].sale : 0,
        mape: mape
      }
    })

    ctx.set('Cache-Control', 'max-age=172800')

    ctx.body = {
      data: responseData
    }
  }
})
