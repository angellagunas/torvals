const Route = require('lib/router/route')
const ObjectId = require('mongodb').ObjectID
const { DataSetRow } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/local/historical',
  handler: async function (ctx) {
    var data = ctx.request.query
    const datasets = Object.values(data).map(item => { return ObjectId(item) })

    const key = {date: '$data.forecastDate'}

    var match = [
      {
        '$match': {
          dataset: { $in: datasets }
        }
      },
      {
        '$lookup': {
          'from': 'channels',
          'localField': 'channel',
          'foreignField': '_id',
          'as': 'channelInfo'
        }
      },
      {
        '$lookup': {
          from: 'salescenters',
          localField: 'salesCenter',
          foreignField: '_id',
          as: 'SalesCenterInfo'
        }
      },
      {
        '$lookup': {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      }
    ]

    if (data.channels) {
      match.push({'$match': {'channelInfo.uuid': {$in: data.channels}}})
    }

    if (data.salesCenters) {
      match.push({'$match': {'SalesCenterInfo.uuid': {$in: data.salesCenters}}})
    }

    if (data.products) {
      match.push({'$match': {'productInfo.uuid': {$in: data.products}}})
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

    ctx.set('Cache-Control', 'max-age=172800')

    ctx.body = {
      data: responseData
    }
  }
})
