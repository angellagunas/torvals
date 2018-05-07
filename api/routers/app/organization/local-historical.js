const Route = require('lib/router/route')
const moment = require('moment')
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

    var initialMatch = {
      dataset: { $in: datasets }
    }

    if (data.channels) {
      const channels = await Channel.find({ uuid: { $in: data.channels } }).select({'_id': 1})
      initialMatch['channel'] = {$in: channels.map(item => { return item._id })}
    }

    if (data.salesCenters) {
      const salesCenters = await SalesCenter.find({ uuid: { $in: data.salesCenters } }).select({'_id': 1})
      initialMatch['salesCenter'] = { $in: salesCenters.map(item => { return item._id }) }
    }

    if (data.products) {
      const products = await Product.find({ uuid: { $in: data.products } }).select({'_id': 1})
      initialMatch['product'] = { $in: products.map(item => { return item._id }) }
    }
    var matchPreviousSale = Array.from(initialMatch)

    if (data.date_start && data.date_end) {
      initialMatch['data.forecastDate'] = {
        $gte: moment.utc(data.date_start, 'YYYY-MM-DD').toDate(),
        $lte: moment.utc(data.date_end, 'YYYY-MM-DD').toDate()
      }

      matchPreviousSale['data.forecastDate'] = {
        $gte: moment.utc(data.date_start, 'YYYY-MM-DD').subtract(1, 'years').toDate(),
        $lte: moment.utc(data.date_end, 'YYYY-MM-DD').subtract(1, 'years').toDate()
      }
    } else {
      ctx.throw(400, 'Es necesario filtrarlo por un rango de fechas!')
    }

    var match = [
      {
        '$match': {
          ...initialMatch
        }
      },
      {
        '$group': {
          _id: key,
          prediction: { $sum: '$data.prediction' },
          adjustment: { $sum: '$data.adjustment' },
          sale: { $sum: '$data.sale' }
        }
      }
    ]

    matchPreviousSale = [
      {
        '$match': {
          ...matchPreviousSale
        }
      },
      {
        '$group': {
          _id: key,
          sale: { $sum: '$data.sale' }
        }
      }
    ]

    match.push({ $sort: { '_id.date': 1 } })
    matchPreviousSale.push({ $sort: { '_id.date': 1 } })

    var responseData = await DataSetRow.aggregate(match)
    var previousSale = await DataSetRow.aggregate(matchPreviousSale)

    var previousSaleDict = {}
    for (var prev of previousSale) {
      previousSaleDict[moment(prev._id.date).format('YYYY-MM-DD')] = prev
    }

    var totalPrediction = 0
    var totalSale = 0

    responseData = responseData.map(item => {
      let previousDate = moment(item._id.date).subtract(1, 'years').format('YYYY-MM-DD')
      if (item.prediction && item.sale) {
        totalPrediction += item.prediction
        totalSale += item.sale
      }

      return {
        date: item._id.date,
        prediction: item.prediction,
        adjustment: item.adjustment,
        sale: item.sale,
        previousSale: previousSaleDict[previousDate] ? previousSaleDict[previousDate].sale : 0
      }
    })

    let mape = 0

    if (totalSale !== 0) {
      mape = Math.abs((totalSale - totalPrediction) / totalSale)
    }

    ctx.set('Cache-Control', 'max-age=86400')

    ctx.body = {
      data: responseData,
      mape: mape
    }
  }
})
