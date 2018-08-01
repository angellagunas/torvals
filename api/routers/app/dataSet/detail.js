const Route = require('lib/router/route')
const {DataSet} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      'organization': ctx.state.organization._id
    })
      .populate('fileChunk')
      .populate('project')
      .populate('rule')
      .populate('organization')
      .populate('channels')
      .populate('products')
      .populate('salesCenters')
      .populate('catalogItems')
      .populate('catalogItems.catalog')
    await dataset.rule.populate('catalogs').execPopulate()

    ctx.assert(dataset, 404, 'DataSet no encontrado ')

    ctx.body = {
      data: dataset.toPublic()
    }
  }
})