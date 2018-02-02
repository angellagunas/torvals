const Route = require('lib/router/route')

const { DataSetRow, DataSet, Channel, SalesCenter, Product } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/filters/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    })

    ctx.assert(dataset, 404, 'DataSet not found')

    var rows = await DataSetRow.find({isDeleted: false, dataset: dataset})

    var semanasBimbo = Array.from(new Set(rows.map(item => { return item.data.semanaBimbo })))
    var channels = Array.from(new Set(rows.map(item => { return String(item.channel) })))
    var salesCenters = Array.from(new Set(rows.map(item => { return String(item.salesCenter) })))
    var products = Array.from(new Set(rows.map(item => { return String(item.product) })))

    semanasBimbo.sort((a, b) => {
      return a - b
    })

    channels = await Channel.find({ _id: { $in: channels } })
    salesCenters = await SalesCenter.find({ _id: { $in: salesCenters } })
    products = await Product.find({ _id: { $in: products } })

    ctx.body = {
      semanasBimbo,
      channels,
      salesCenters,
      products
    }
  }
})
