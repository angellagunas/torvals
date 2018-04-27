const Route = require('lib/router/route')
const moment = require('moment')

const { DataSetRow, DataSet, Channel, SalesCenter, Product, AbraxasDate } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/filters/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    var rows = await DataSetRow.find({isDeleted: false, dataset: dataset._id})

    var semanasBimbo = Array.from(new Set(rows.map(item => { return item.data.semanaBimbo })))
    var channels = Array.from(new Set(rows.map(item => { return String(item.channel) })))
    var salesCenters = Array.from(new Set(rows.map(item => { return String(item.salesCenter) })))
    var products = Array.from(new Set(rows.map(item => { return String(item.product) })))

    semanasBimbo.sort((a, b) => {
      return a - b
    })

    var dates = await AbraxasDate.find({
      week: {$in: semanasBimbo},
      dateStart: {$lte: moment(dataset.dateMax), $gte: moment(dataset.dateMin)}
    }).sort('-dateStart').limit(semanasBimbo.length)

    dates = dates.map(item => {
      return {
        week: item.week,
        month: item.month,
        year: item.year,
        dateStart: item.dateStart,
        dateEnd: item.dateEnd
      }
    })

    channels = await Channel.find({ _id: { $in: channels } })
    salesCenters = await SalesCenter.find({ _id: { $in: salesCenters } })
    products = await Product.find({ _id: { $in: products } })

    ctx.body = {
      semanasBimbo,
      channels,
      salesCenters,
      products,
      dates
    }
  }
})
