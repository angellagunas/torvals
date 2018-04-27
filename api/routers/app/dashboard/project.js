const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {
  Channel,
  Product,
  SalesCenter,
  Project,
  DataSetRow
} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/projects',
  handler: async function (ctx) {
    var channelsSet = new Set()
    var salesCentersSet = new Set()
    var productsSet = new Set()

    var projectsUuid = ctx.request.body

    // const projects = await Project.find({ isDeleted: false, activeDataset: { $ne: null }, uuid: { $in: projectsUuid } }).populate('activeDataset')

    // ctx.assert(projects, 404, 'Proyectos no encontrado')

    for (var project of projectsUuid) {
      let rows = await DataSetRow.find({ isDeleted: false, dataset: project })
      for (var row of rows) {
        channelsSet.add(row.channel)
        salesCentersSet.add(row.salesCenter)
        productsSet.add(row.product)
      }
    }

    var channels = Array.from(channelsSet)
    var salesCenters = Array.from(salesCentersSet)
    var products = Array.from(productsSet)

    channels = await Channel.find({ _id: { $in: channels } })
    salesCenters = await SalesCenter.find({ _id: { $in: salesCenters } })
    products = await Product.find({ _id: { $in: products } })

    ctx.body = {
      channels,
      salesCenters,
      products
    }
  }
})
