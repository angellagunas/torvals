const Route = require('lib/router/route')
const { Project, DataSetRow, Channel, SalesCenter, Product, AbraxasDate } = require('models')
const moment = require('moment')

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

    const key = {week: '$data.semanaBimbo', date: '$data.forecastDate'}

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
      const weeks = await AbraxasDate.find({ $and: [{dateStart: {$gte: data.date_start}}, {dateEnd: {$lte: data.date_end}}] })
      data.weeks = []
      for (let week of weeks) {
        data.weeks.push(week.week)
      }

      data.year = moment(data.date_start).year()

      initialMatch['data.semanaBimbo'] = {$in: data.weeks}

      var lastYear = data.year - 1
      matchPreviousSale['data.semanaBimbo'] = {$in: data.weeks}
    } else {
      ctx.throw(400, '¡Es necesario filtrarlo por un rango de fechas!')
    }

    var match = [
      {
        '$match': {
          ...initialMatch
        }
      },
      {
        '$redact': {
          '$cond': [
                { '$eq': [{ '$year': '$data.forecastDate' }, data.year] },
            '$$KEEP',
            '$$PRUNE'
          ]
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
        '$redact': {
          '$cond': [
              { '$eq': [{ '$year': '$data.forecastDate' }, lastYear] },
            '$$KEEP',
            '$$PRUNE'
          ]
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
      previousSaleDict[prev._id.week] = prev
    }

    var totalPrediction = 0
    var totalSale = 0

    responseData = responseData.map(item => {
      if (item.prediction && item.sale) {
        totalPrediction += item.prediction
        totalSale += item.sale
      }

      return {
        date: item._id.date,
        week: item._id.week,
        prediction: item.prediction,
        adjustment: item.adjustment,
        sale: item.sale,
        previousSale: previousSaleDict[item._id.week] ? previousSaleDict[item._id.week].sale : 0
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
