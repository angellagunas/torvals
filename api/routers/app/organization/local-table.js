const Route = require('lib/router/route')
const moment = require('moment')
const { Project, DataSetRow, Product, Channel, SalesCenter, AbraxasDate } = require('models')

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
      ctx.throw(400, 'Es necesario filtrarlo por un rango de fechas!')
    }

    var match = [
      {
        '$match': {
          ...initialMatch
        }
      },
      {
        '$match': {
          '$expr': { '$eq': [{ '$year': '$data.forecastDate' }, data.year] }
        }
      },
      {
        '$group': {
          _id: key,
          prediction: { $sum: '$data.prediction' },
          predictionSale: {
            $sum: {
              $cond: {
                if: {
                  $gt: ['$data.sale', 0]
                },
                then: '$data.prediction',
                else: 0
              }
            }
          },
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
        '$match': {
          '$expr': { '$eq': [{ '$year': '$data.forecastDate' }, lastYear] }
        }
      },
      {
        '$group': {
          _id: key,
          sale: { $sum: '$data.sale' }
        }
      }
    ]

    var allData = await DataSetRow.aggregate(match)
    var previousSale = await DataSetRow.aggregate(matchPreviousSale)
    var products = allData.map(item => { return item._id.product })
    products = await Product.find({_id: {$in: products}})

    var dataDict = {}

    for (var prod of products) {
      if (!dataDict[prod._id]) {
        dataDict[prod._id] = {
          product: prod.toPublic(),
          previousSale: 0,
          sale: {
            prediction: 0,
            adjustment: 0,
            sale: 0
          }
        }
      } else {
        dataDict[prod._id]['product'] = prod.toPublic()
      }
    }

    for (var prev of previousSale) {
      if (dataDict[prev._id.product]) {
        dataDict[prev._id.product]['previousSale'] = prev.sale
      }
    }

    var responseData = allData.map(item => {
      let product = item._id.product
      let data = dataDict[product]
      let mape = 0
      let prediction = item.predictionSale
      let sale = item.sale

      if (sale > 0) {
        mape = Math.abs((sale - prediction) / sale) * 100
      }

      return {
        product: data.product,
        prediction: item.prediction,
        adjustment: item.adjustment,
        sale: item.sale,
        previousSale: data.previousSale,
        mape: mape
      }
    })

    ctx.set('Cache-Control', 'max-age=86400')

    ctx.body = {
      data: responseData
    }
  }
})
