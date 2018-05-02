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

    if (data.date_start && data.date_end) {
      match.push({
        '$match': {
          'data.forecastDate': {
            $gte: moment.utc(data.date_start, 'YYYY-MM-DD').toDate(),
            $lte: moment.utc(data.date_end, 'YYYY-MM-DD').toDate()
          }
        }
      })
    }

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

    match.push({
      '$group': {
        _id: key,
        prediction: { $sum: '$data.prediction' },
        adjustment: { $sum: '$data.adjustment' },
        sale: { $sum: '$data.sale' }
      }
    })

    var responseData = await DataSetRow.aggregate(match)

    var products = responseData.map(item => { return item._id.product })
    products = await Product.find({_id: {$in: products}})

    var productsHash = {}
    products.map(item => {
      productsHash[item._id] = item.toPublic()
    })

    responseData = responseData.map(item => {
      return {
        product: productsHash[item._id.product],
        prediction: item.prediction,
        adjustment: item.adjustment,
        sale: item.sale,
        previousSale: 0
      }
    })

    ctx.set('Cache-Control', 'max-age=172800')

    ctx.body = {
      data: responseData
    }
  }
})
