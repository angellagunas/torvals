const Route = require('lib/router/route')
const ObjectId = require('mongodb').ObjectID
const { DataSetRow } = require('models')

module.exports = new Route({
  method: 'get',
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
        '$group': {
          _id: key,
          prediction: { $sum: '$data.prediction' },
          adjustment: { $sum: '$data.adjustment' },
          sale: { $sum: '$data.sale' }
        }
      }
    ]

    var responseData = await DataSetRow.aggregate(match)

    ctx.body = {
      data: responseData
    }
  }
})
