const Route = require('lib/router/route')
const { Project, DataSetRow, Channel, SalesCenter, Product } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/local/historical',
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

    const key = {date: '$data.forecastDate'}

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

    match.push({
      '$group': {
        _id: key,
        prediction: { $sum: '$data.prediction' },
        adjustment: { $sum: '$data.adjustment' },
        sale: { $sum: '$data.sale' }
      }
    })

    var responseData = await DataSetRow.aggregate(match)

    responseData = responseData.map(item => {
      return {
        date: item._id.date,
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
