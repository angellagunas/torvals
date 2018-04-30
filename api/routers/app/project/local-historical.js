const Route = require('lib/router/route')
const { Project, DataSetRow } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/local/historical',
  handler: async function (ctx) {
    var data = ctx.request.query

    const projects = await Project.find({uuid: {$in: data.projects}})
    const datasets = projects.map(item => { return item.activeDataset })

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
